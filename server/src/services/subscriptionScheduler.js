const cron = require('node-cron');
const db = require('../config/database');
const walletController = require('../controllers/walletController');

/**
 * Subscription Scheduler Service
 * Handles automated tasks for subscription system
 */

// Process deliveries daily at 8 PM (create orders for tomorrow)
const processDeliveriesJob = cron.schedule('0 20 * * *', async () => {
  console.log('🔄 [Cron] Processing deliveries for tomorrow...');
  
  try {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // Get all deliveries scheduled for tomorrow
      const deliveriesResult = await client.query(
        `SELECT pd.*, up.user_id, up.locked_items, sp.name as plan_name
         FROM plan_deliveries pd
         JOIN user_plans up ON pd.user_plan_id = up.id
         JOIN subscription_plans sp ON up.plan_id = sp.id
         WHERE pd.scheduled_date = $1 
         AND pd.status = 'scheduled' 
         AND up.status = 'active'
         AND pd.order_id IS NULL`,
        [tomorrow]
      );

      console.log(`📦 Found ${deliveriesResult.rows.length} deliveries to process`);

      for (const delivery of deliveriesResult.rows) {
        try {
          // Calculate order total
          const items = delivery.locked_items;
          const total = items.reduce((sum, item) => sum + (parseFloat(item.locked_price) * (item.quantity || 1)), 0);

          // Create order
          const orderResult = await client.query(
            `INSERT INTO orders 
             (user_id, total_amount, subtotal, shipping_address, payment_method, payment_status, 
              status, order_type, user_plan_id, plan_delivery_id, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [
              delivery.user_id,
              total,
              total,
              delivery.delivery_address || 'Subscription delivery',
              'prepaid',
              'paid',
              'confirmed',
              'subscription',
              delivery.user_plan_id,
              delivery.id,
              `Subscription delivery: ${delivery.plan_name}`,
            ]
          );

          const order = orderResult.rows[0];

          // Create order items
          for (const item of items) {
            await client.query(
              'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
              [order.id, item.product_id, item.quantity || 1, item.locked_price]
            );

            // Deduct stock
            await client.query(
              'UPDATE products SET stock_quantity = stock_quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
              [item.quantity || 1, item.product_id]
            );
          }

          // Update delivery status
          await client.query(
            `UPDATE plan_deliveries 
             SET status = 'order_created', order_id = $1, modified_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [order.id, delivery.id]
          );

          // Update user plan stats
          await client.query(
            `UPDATE user_plans 
             SET deliveries_used = deliveries_used + 1, 
                 deliveries_remaining = deliveries_remaining - 1,
                 last_activity_date = CURRENT_DATE
             WHERE id = $1`,
            [delivery.user_plan_id]
          );

          console.log(`✅ Created order ${order.id} for delivery ${delivery.id}`);
        } catch (error) {
          console.error(`❌ Error processing delivery ${delivery.id}:`, error.message);
          // Continue with other deliveries
        }
      }

      await client.query('COMMIT');
      console.log(`✅ [Cron] Successfully processed ${deliveriesResult.rows.length} deliveries`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ [Cron] Process deliveries job failed:', error);
  }
}, {
  scheduled: false, // Don't start automatically
  timezone: 'Asia/Kolkata',
});

// Send delivery reminders at 7 AM daily
const deliveryRemindersJob = cron.schedule('0 7 * * *', async () => {
  console.log('📧 [Cron] Sending delivery reminders...');
  
  try {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const result = await db.query(
      `SELECT pd.*, u.name, u.email, sp.name as plan_name
       FROM plan_deliveries pd
       JOIN user_plans up ON pd.user_plan_id = up.id
       JOIN subscription_plans sp ON up.plan_id = sp.id
       JOIN users u ON up.user_id = u.id
       WHERE pd.scheduled_date = $1 
       AND pd.status = 'scheduled' 
       AND up.status = 'active'`,
      [tomorrow]
    );

    console.log(`📬 Found ${result.rows.length} deliveries to remind`);

    // TODO: Implement email sending here
    // for (const delivery of result.rows) {
    //   await emailService.sendDeliveryReminder(delivery.email, delivery);
    // }

    console.log(`✅ [Cron] Sent ${result.rows.length} delivery reminders`);
  } catch (error) {
    console.error('❌ [Cron] Delivery reminders job failed:', error);
  }
}, {
  scheduled: false,
  timezone: 'Asia/Kolkata',
});

// Send weekly scheduling reminders every Monday at 10 AM
const schedulingRemindersJob = cron.schedule('0 10 * * 1', async () => {
  console.log('📧 [Cron] Sending scheduling reminders...');
  
  try {
    // Find users with active plans but no upcoming deliveries
    const result = await db.query(
      `SELECT DISTINCT u.email, u.name, up.id as user_plan_id, sp.name as plan_name, up.deliveries_remaining
       FROM user_plans up
       JOIN subscription_plans sp ON up.plan_id = sp.id
       JOIN users u ON up.user_id = u.id
       WHERE up.status = 'active' 
       AND up.deliveries_remaining > 0
       AND NOT EXISTS (
         SELECT 1 FROM plan_deliveries pd 
         WHERE pd.user_plan_id = up.id 
         AND pd.scheduled_date >= CURRENT_DATE 
         AND pd.status = 'scheduled'
       )`
    );

    console.log(`📬 Found ${result.rows.length} users to remind about scheduling`);

    // TODO: Implement email sending here
    // for (const user of result.rows) {
    //   await emailService.sendSchedulingReminder(user.email, user);
    // }

    console.log(`✅ [Cron] Sent ${result.rows.length} scheduling reminders`);
  } catch (error) {
    console.error('❌ [Cron] Scheduling reminders job failed:', error);
  }
}, {
  scheduled: false,
  timezone: 'Asia/Kolkata',
});

// Expire inactive plans and convert to wallet daily at 2 AM
const expirePlansJob = cron.schedule('0 2 * * *', async () => {
  console.log('🔄 [Cron] Checking for expired plans...');
  
  try {
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // Find plans with no activity in 90 days and still have remaining deliveries
      const inactivePlansResult = await client.query(
        `SELECT up.*, sp.name as plan_name, u.email
         FROM user_plans up
         JOIN subscription_plans sp ON up.plan_id = sp.id
         JOIN users u ON up.user_id = u.id
         WHERE up.status = 'active'
         AND up.deliveries_remaining > 0
         AND up.last_activity_date < CURRENT_DATE - INTERVAL '90 days'
         AND NOT up.wallet_credit_converted`
      );

      console.log(`💰 Found ${inactivePlansResult.rows.length} inactive plans to convert`);

      for (const plan of inactivePlansResult.rows) {
        try {
          // Calculate wallet credit
          const perDeliveryValue = parseFloat(plan.payment_amount) / plan.total_deliveries;
          const creditAmount = perDeliveryValue * plan.deliveries_remaining;

          // Credit wallet
          await walletController.creditWallet(
            plan.user_id,
            creditAmount,
            `Inactive subscription converted to wallet: ${plan.plan_name}`,
            { user_plan_id: plan.id, reason: 'inactivity_90_days' },
            client
          );

          // Update plan status
          await client.query(
            `UPDATE user_plans 
             SET status = 'expired', 
                 wallet_credit_converted = true,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [plan.id]
          );

          // Cancel remaining deliveries
          await client.query(
            `UPDATE plan_deliveries 
             SET status = 'expired', modified_at = CURRENT_TIMESTAMP
             WHERE user_plan_id = $1 AND status = 'scheduled'`,
            [plan.id]
          );

          console.log(`✅ Converted plan ${plan.id} to wallet credit: ₹${creditAmount}`);

          // TODO: Send email notification
          // await emailService.sendPlanExpiredNotification(plan.email, plan, creditAmount);
        } catch (error) {
          console.error(`❌ Error converting plan ${plan.id}:`, error.message);
        }
      }

      await client.query('COMMIT');
      console.log(`✅ [Cron] Successfully processed ${inactivePlansResult.rows.length} expired plans`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ [Cron] Expire plans job failed:', error);
  }
}, {
  scheduled: false,
  timezone: 'Asia/Kolkata',
});

// Start all cron jobs
const startScheduler = () => {
  console.log('⏰ Starting subscription scheduler...');
  
  processDeliveriesJob.start();
  console.log('✅ Process deliveries job scheduled (daily at 8 PM)');
  
  deliveryRemindersJob.start();
  console.log('✅ Delivery reminders job scheduled (daily at 7 AM)');
  
  schedulingRemindersJob.start();
  console.log('✅ Scheduling reminders job scheduled (Monday at 10 AM)');
  
  expirePlansJob.start();
  console.log('✅ Expire plans job scheduled (daily at 2 AM)');
  
  console.log('✅ All subscription cron jobs started successfully');
};

// Stop all cron jobs
const stopScheduler = () => {
  processDeliveriesJob.stop();
  deliveryRemindersJob.stop();
  schedulingRemindersJob.stop();
  expirePlansJob.stop();
  console.log('⏹️ All subscription cron jobs stopped');
};

module.exports = {
  startScheduler,
  stopScheduler,
  processDeliveriesJob,
  deliveryRemindersJob,
  schedulingRemindersJob,
  expirePlansJob,
};
