const db = require('../config/database');
const walletController = require('./walletController');

// Get all subscription plans (for customers)
const getSubscriptionPlans = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, description, price, validity_days, total_deliveries, 
              delivery_frequency, default_delivery_days, items, discount_percentage, coming_soon
       FROM subscription_plans 
       WHERE is_active = true 
       ORDER BY price ASC`
    );

    res.json({
      plans: result.rows.map(plan => ({
        ...plan,
        price: parseFloat(plan.price),
        discount_percentage: parseFloat(plan.discount_percentage),
        coming_soon: plan.coming_soon || false,
      })),
    });
  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Purchase subscription plan
const purchasePlan = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const userId = req.user.id;
    const {
      plan_id,
      activation_date,
      delivery_schedule, // Array of dates or frequency pattern
      delivery_frequency, // 'weekly', 'biweekly', 'custom'
      delivery_days, // ['monday', 'wednesday']
      time_slot,
      payment_id,
      use_wallet = false,
    } = req.body;

    if (!plan_id || !activation_date) {
      return res.status(400).json({ message: 'Plan ID and activation date are required' });
    }

    await client.query('BEGIN');

    // Get plan details
    const planResult = await client.query(
      'SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true',
      [plan_id]
    );

    if (planResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Plan not found or inactive' });
    }

    const plan = planResult.rows[0];
    const planPrice = parseFloat(plan.price);

    // Handle payment
    let walletAmountUsed = 0;
    let remainingAmount = planPrice;

    if (use_wallet) {
      const wallet = await walletController.getOrCreateWallet(userId, client);
      const walletBalance = parseFloat(wallet.balance);

      if (walletBalance > 0) {
        walletAmountUsed = Math.min(walletBalance, planPrice);
        remainingAmount = planPrice - walletAmountUsed;

        // Debit wallet
        await walletController.debitWallet(
          userId,
          walletAmountUsed,
          `Subscription plan purchase: ${plan.name}`,
          { plan_id },
          client
        );
      }
    }

    if (remainingAmount > 0 && !payment_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: 'Payment required',
        remaining_amount: remainingAmount,
      });
    }

    // Calculate expiry date
    const activationDate = new Date(activation_date);
    const expiryDate = new Date(activationDate);
    expiryDate.setDate(expiryDate.getDate() + plan.validity_days);

    // Create user plan
    const userPlanResult = await client.query(
      `INSERT INTO user_plans 
       (user_id, plan_id, activation_date, expiry_date, total_deliveries, 
        deliveries_remaining, payment_amount, payment_id, wallet_amount_used, last_activity_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE)
       RETURNING *`,
      [
        userId,
        plan_id,
        activationDate,
        expiryDate,
        plan.total_deliveries,
        plan.total_deliveries,
        planPrice,
        payment_id || null,
        walletAmountUsed,
      ]
    );

    const userPlan = userPlanResult.rows[0];

    // Generate delivery schedule
    const deliveryDates = generateDeliverySchedule(
      activationDate,
      plan.total_deliveries,
      delivery_frequency || plan.delivery_frequency,
      delivery_days || plan.default_delivery_days,
      delivery_schedule
    );

    // Create delivery slots
    for (const date of deliveryDates) {
      await client.query(
        `INSERT INTO plan_deliveries 
         (user_plan_id, scheduled_date, delivery_time_slot, status, locked_items)
         VALUES ($1, $2, $3, $4, $5)`,
        [userPlan.id, date, time_slot || '10am-12pm', 'scheduled', JSON.stringify(plan.items)]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Subscription plan purchased successfully',
      user_plan: {
        ...userPlan,
        wallet_amount_used: walletAmountUsed,
        remaining_amount: remainingAmount,
      },
      delivery_dates: deliveryDates,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Purchase plan error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
};

// Helper function to generate delivery schedule
const generateDeliverySchedule = (startDate, totalDeliveries, frequency, deliveryDays, customSchedule) => {
  const dates = [];

  if (customSchedule && Array.isArray(customSchedule)) {
    // Custom dates provided
    return customSchedule.slice(0, totalDeliveries);
  }

  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const selectedDays = Array.isArray(deliveryDays) 
    ? deliveryDays.map(d => d.toLowerCase()) 
    : ['monday'];

  let currentDate = new Date(startDate);
  let deliveriesScheduled = 0;

  while (deliveriesScheduled < totalDeliveries) {
    const dayName = daysOfWeek[currentDate.getDay()];

    if (selectedDays.includes(dayName)) {
      dates.push(currentDate.toISOString().split('T')[0]);
      deliveriesScheduled++;
    }

    currentDate.setDate(currentDate.getDate() + 1);

    // Safety check: don't go beyond 2 years
    if (dates.length > 0 && 
        (currentDate - new Date(dates[0])) > 730 * 24 * 60 * 60 * 1000) {
      break;
    }
  }

  return dates;
};

// Get user's subscriptions
const getMySubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT up.*, sp.name as plan_name, sp.description, sp.items,
              COUNT(pd.id) FILTER (WHERE pd.status = 'completed') as completed_deliveries,
              COUNT(pd.id) FILTER (WHERE pd.status = 'scheduled') as scheduled_deliveries
       FROM user_plans up
       JOIN subscription_plans sp ON up.plan_id = sp.id
       LEFT JOIN plan_deliveries pd ON up.id = pd.user_plan_id
       WHERE up.user_id = $1
       GROUP BY up.id, sp.name, sp.description, sp.items
       ORDER BY up.created_at DESC`,
      [userId]
    );

    res.json({
      subscriptions: result.rows.map(sub => ({
        ...sub,
        payment_amount: parseFloat(sub.payment_amount),
        completed_deliveries: parseInt(sub.completed_deliveries),
        scheduled_deliveries: parseInt(sub.scheduled_deliveries),
      })),
    });
  } catch (error) {
    console.error('Get my subscriptions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get subscription calendar
const getSubscriptionCalendar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { month, year } = req.query;

    // Verify ownership
    const planResult = await db.query(
      'SELECT * FROM user_plans WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (planResult.rows.length === 0) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    const userPlan = planResult.rows[0];

    // Get deliveries
    let query = `
      SELECT * FROM plan_deliveries 
      WHERE user_plan_id = $1
    `;
    const params = [id];

    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM scheduled_date) = $2 AND EXTRACT(YEAR FROM scheduled_date) = $3`;
      params.push(month, year);
    }

    query += ' ORDER BY scheduled_date ASC';

    const deliveriesResult = await db.query(query, params);

    res.json({
      subscription: userPlan,
      deliveries: deliveriesResult.rows,
    });
  } catch (error) {
    console.error('Get subscription calendar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Skip delivery
const skipDelivery = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { reason } = req.body;

    await client.query('BEGIN');

    // Get delivery and verify ownership
    const deliveryResult = await client.query(
      `SELECT pd.*, up.user_id 
       FROM plan_deliveries pd
       JOIN user_plans up ON pd.user_plan_id = up.id
       WHERE pd.id = $1`,
      [id]
    );

    if (deliveryResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Delivery not found' });
    }

    const delivery = deliveryResult.rows[0];

    if (delivery.user_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if can modify
    if (!delivery.can_modify || new Date() > new Date(delivery.can_modify_until)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'Cutoff time passed. Cannot modify this delivery.',
        cutoff_time: delivery.can_modify_until,
      });
    }

    if (delivery.status !== 'scheduled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Can only skip scheduled deliveries' });
    }

    // Update delivery status
    await client.query(
      `UPDATE plan_deliveries 
       SET status = 'skipped', skip_reason = $1, modified_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [reason || 'User skipped', id]
    );

    // Record modification
    await client.query(
      `INSERT INTO plan_modifications 
       (user_plan_id, plan_delivery_id, action, old_value, new_value, modified_by, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        delivery.user_plan_id,
        id,
        'skip',
        JSON.stringify({ status: 'scheduled' }),
        JSON.stringify({ status: 'skipped' }),
        userId,
        reason,
      ]
    );

    await client.query('COMMIT');

    res.json({ message: 'Delivery skipped successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Skip delivery error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

// Reschedule delivery
const rescheduleDelivery = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { new_date, time_slot } = req.body;

    if (!new_date) {
      return res.status(400).json({ message: 'New date is required' });
    }

    await client.query('BEGIN');

    // Get delivery and verify ownership
    const deliveryResult = await client.query(
      `SELECT pd.*, up.user_id, up.expiry_date, sp.max_reschedules_per_delivery
       FROM plan_deliveries pd
       JOIN user_plans up ON pd.user_plan_id = up.id
       JOIN subscription_plans sp ON up.plan_id = sp.id
       WHERE pd.id = $1`,
      [id]
    );

    if (deliveryResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Delivery not found' });
    }

    const delivery = deliveryResult.rows[0];

    if (delivery.user_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if can modify
    if (!delivery.can_modify || new Date() > new Date(delivery.can_modify_until)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'Cutoff time passed. Cannot modify this delivery.',
        cutoff_time: delivery.can_modify_until,
      });
    }

    // Check reschedule limit
    if (delivery.reschedule_count >= delivery.max_reschedules_per_delivery) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: `Maximum ${delivery.max_reschedules_per_delivery} reschedules allowed per delivery`,
      });
    }

    // Validate new date is within plan validity
    if (new Date(new_date) > new Date(delivery.expiry_date)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'Cannot reschedule beyond plan expiry date',
        expiry_date: delivery.expiry_date,
      });
    }

    // Check if date already has a delivery
    const conflictResult = await client.query(
      `SELECT id FROM plan_deliveries 
       WHERE user_plan_id = $1 AND scheduled_date = $2 AND id != $3 AND status NOT IN ('skipped', 'cancelled')`,
      [delivery.user_plan_id, new_date, id]
    );

    if (conflictResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'You already have a delivery scheduled on this date',
      });
    }

    // Update delivery
    await client.query(
      `UPDATE plan_deliveries 
       SET scheduled_date = $1, 
           time_slot = COALESCE($2, time_slot),
           original_date = COALESCE(original_date, scheduled_date),
           reschedule_count = reschedule_count + 1,
           modified_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [new_date, time_slot, id]
    );

    // Record modification
    await client.query(
      `INSERT INTO plan_modifications 
       (user_plan_id, plan_delivery_id, action, old_value, new_value, modified_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        delivery.user_plan_id,
        id,
        'reschedule',
        JSON.stringify({ date: delivery.scheduled_date, time_slot: delivery.time_slot }),
        JSON.stringify({ date: new_date, time_slot }),
        userId,
      ]
    );

    await client.query('COMMIT');

    res.json({ message: 'Delivery rescheduled successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reschedule delivery error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

// Pause plan
const pausePlan = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { pause_start_date, pause_end_date, reason } = req.body;

    if (!pause_start_date || !pause_end_date) {
      return res.status(400).json({ message: 'Pause start and end dates are required' });
    }

    await client.query('BEGIN');

    // Get plan and verify ownership
    const planResult = await client.query(
      'SELECT * FROM user_plans WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (planResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Subscription not found' });
    }

    const plan = planResult.rows[0];

    if (plan.status !== 'active') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Can only pause active subscriptions' });
    }

    // Validate pause dates
    const pauseStart = new Date(pause_start_date);
    const pauseEnd = new Date(pause_end_date);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (pauseStart < tomorrow) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Pause must start at least 1 day from now' });
    }

    if (pauseEnd <= pauseStart) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Pause end date must be after start date' });
    }

    // Calculate new expiry date (extend by pause duration)
    const pauseDays = Math.ceil((pauseEnd - pauseStart) / (1000 * 60 * 60 * 24));
    const newExpiryDate = new Date(plan.expiry_date);
    newExpiryDate.setDate(newExpiryDate.getDate() + pauseDays);

    // Update plan
    await client.query(
      `UPDATE user_plans 
       SET status = 'paused', 
           pause_start_date = $1, 
           pause_end_date = $2,
           expiry_date = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [pause_start_date, pause_end_date, newExpiryDate, id]
    );

    // Mark deliveries in pause period as paused
    await client.query(
      `UPDATE plan_deliveries 
       SET status = 'paused', modified_at = CURRENT_TIMESTAMP
       WHERE user_plan_id = $1 
       AND scheduled_date BETWEEN $2 AND $3
       AND status = 'scheduled'`,
      [id, pause_start_date, pause_end_date]
    );

    // Record modification
    await client.query(
      `INSERT INTO plan_modifications 
       (user_plan_id, action, old_value, new_value, modified_by, reason)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        'pause',
        JSON.stringify({ status: 'active', expiry_date: plan.expiry_date }),
        JSON.stringify({ status: 'paused', pause_start_date, pause_end_date, new_expiry_date: newExpiryDate }),
        userId,
        reason,
      ]
    );

    await client.query('COMMIT');

    res.json({ 
      message: 'Subscription paused successfully',
      pause_duration_days: pauseDays,
      new_expiry_date: newExpiryDate,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Pause plan error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

// Resume plan
const resumePlan = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const userId = req.user.id;
    const { id } = req.params;

    await client.query('BEGIN');

    // Get plan and verify ownership
    const planResult = await client.query(
      'SELECT * FROM user_plans WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (planResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Subscription not found' });
    }

    const plan = planResult.rows[0];

    if (plan.status !== 'paused') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Can only resume paused subscriptions' });
    }

    // Update plan
    await client.query(
      `UPDATE user_plans 
       SET status = 'active', 
           pause_start_date = NULL, 
           pause_end_date = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    // Revert paused deliveries to scheduled
    await client.query(
      `UPDATE plan_deliveries 
       SET status = 'scheduled', modified_at = CURRENT_TIMESTAMP
       WHERE user_plan_id = $1 AND status = 'paused'`,
      [id]
    );

    // Record modification
    await client.query(
      `INSERT INTO plan_modifications 
       (user_plan_id, action, old_value, new_value, modified_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        id,
        'resume',
        JSON.stringify({ status: 'paused' }),
        JSON.stringify({ status: 'active' }),
        userId,
      ]
    );

    await client.query('COMMIT');

    res.json({ message: 'Subscription resumed successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Resume plan error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

// Cancel plan (convert to wallet)
const cancelPlan = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { reason } = req.body;

    await client.query('BEGIN');

    // Get plan and verify ownership
    const planResult = await client.query(
      `SELECT up.*, sp.name as plan_name
       FROM user_plans up
       JOIN subscription_plans sp ON up.plan_id = sp.id
       WHERE up.id = $1 AND up.user_id = $2`,
      [id, userId]
    );

    if (planResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Subscription not found' });
    }

    const plan = planResult.rows[0];

    if (plan.status === 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Subscription already cancelled' });
    }

    // Calculate refund amount (remaining deliveries value)
    const perDeliveryValue = parseFloat(plan.payment_amount) / plan.total_deliveries;
    const refundAmount = perDeliveryValue * plan.deliveries_remaining;

    // Update plan status
    await client.query(
      `UPDATE user_plans 
       SET status = 'cancelled', 
           wallet_credit_converted = true,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    // Cancel all scheduled deliveries
    await client.query(
      `UPDATE plan_deliveries 
       SET status = 'cancelled', modified_at = CURRENT_TIMESTAMP
       WHERE user_plan_id = $1 AND status IN ('scheduled', 'paused')`,
      [id]
    );

    // Credit wallet if there are remaining deliveries
    if (refundAmount > 0) {
      await walletController.creditWallet(
        userId,
        refundAmount,
        `Subscription cancellation refund: ${plan.plan_name}`,
        { user_plan_id: id, deliveries_remaining: plan.deliveries_remaining },
        client
      );
    }

    // Record modification
    await client.query(
      `INSERT INTO plan_modifications 
       (user_plan_id, action, old_value, new_value, modified_by, reason)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        'cancel',
        JSON.stringify({ status: plan.status }),
        JSON.stringify({ status: 'cancelled', wallet_credit: refundAmount }),
        userId,
        reason,
      ]
    );

    await client.query('COMMIT');

    res.json({ 
      message: 'Subscription cancelled successfully',
      wallet_credit_added: refundAmount,
      deliveries_cancelled: plan.deliveries_remaining,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cancel plan error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

module.exports = {
  getSubscriptionPlans,
  purchasePlan,
  getMySubscriptions,
  getSubscriptionCalendar,
  skipDelivery,
  rescheduleDelivery,
  pausePlan,
  resumePlan,
  cancelPlan,
  generateDeliverySchedule,
};

// ============================================
// ADMIN FUNCTIONS
// ============================================

// Get all user subscriptions (Admin)
const getAllSubscriptions = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT up.*, sp.name as plan_name, u.name as user_name, u.email as user_email,
             COUNT(pd.id) FILTER (WHERE pd.status = 'completed') as completed_deliveries,
             COUNT(pd.id) FILTER (WHERE pd.status = 'scheduled') as scheduled_deliveries
      FROM user_plans up
      JOIN subscription_plans sp ON up.plan_id = sp.id
      JOIN users u ON up.user_id = u.id
      LEFT JOIN plan_deliveries pd ON up.id = pd.user_plan_id
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` WHERE up.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` GROUP BY up.id, sp.name, u.name, u.email
               ORDER BY up.created_at DESC 
               LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    const countQuery = status
      ? 'SELECT COUNT(*) FROM user_plans WHERE status = $1'
      : 'SELECT COUNT(*) FROM user_plans';
    const countParams = status ? [status] : [];
    const countResult = await db.query(countQuery, countParams);

    res.json({
      subscriptions: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
      },
    });
  } catch (error) {
    console.error('Get all subscriptions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all subscription plans (Admin - including inactive)
const getAllSubscriptionPlans = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, description, price, validity_days, total_deliveries, 
              delivery_frequency, default_delivery_days, items, discount_percentage,
              is_active, coming_soon, created_at, updated_at,
              validity_days as duration_days
       FROM subscription_plans 
       ORDER BY is_active DESC, price ASC`
    );

    // Transform items and features
    const plans = result.rows.map(plan => ({
      ...plan,
      price: parseFloat(plan.price),
      discount_percentage: parseFloat(plan.discount_percentage || 0),
      features: plan.items ? (Array.isArray(plan.items) ? plan.items : [plan.items]) : [],
      duration_days: plan.validity_days,
      coming_soon: plan.coming_soon || false,
    }));

    res.json({ plans });
  } catch (error) {
    console.error('Get all subscription plans error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create subscription plan (Admin)
const createSubscriptionPlan = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      validity_days = 90,
      total_deliveries,
      delivery_frequency,
      default_delivery_days,
      items,
      discount_percentage = 0,
      max_reschedules_per_delivery = 3,
      is_active = true,
      coming_soon = false,
    } = req.body;

    if (!name || !price || !total_deliveries || !items) {
      return res.status(400).json({ 
        message: 'Name, price, total deliveries, and items are required' 
      });
    }

    const result = await db.query(
      `INSERT INTO subscription_plans 
       (name, description, price, validity_days, total_deliveries, delivery_frequency, 
        default_delivery_days, items, discount_percentage, max_reschedules_per_delivery, is_active, coming_soon)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        name,
        description || null,
        price,
        validity_days,
        total_deliveries,
        delivery_frequency || 'custom',
        JSON.stringify(default_delivery_days || []),
        JSON.stringify(items),
        discount_percentage,
        max_reschedules_per_delivery,
        is_active,
        coming_soon,
      ]
    );

    res.status(201).json({
      message: 'Subscription plan created successfully',
      plan: result.rows[0],
    });
  } catch (error) {
    console.error('Create subscription plan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update subscription plan (Admin)
const updateSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      validity_days,
      total_deliveries,
      delivery_frequency,
      default_delivery_days,
      items,
      discount_percentage,
      max_reschedules_per_delivery,
      is_active,
      coming_soon,
    } = req.body;

    const result = await db.query(
      `UPDATE subscription_plans
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           validity_days = COALESCE($4, validity_days),
           total_deliveries = COALESCE($5, total_deliveries),
           delivery_frequency = COALESCE($6, delivery_frequency),
           default_delivery_days = COALESCE($7, default_delivery_days),
           items = COALESCE($8, items),
           discount_percentage = COALESCE($9, discount_percentage),
           max_reschedules_per_delivery = COALESCE($10, max_reschedules_per_delivery),
           is_active = COALESCE($11, is_active),
           coming_soon = COALESCE($12, coming_soon),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $13
       RETURNING *`,
      [
        name,
        description,
        price,
        validity_days,
        total_deliveries,
        delivery_frequency,
        default_delivery_days ? JSON.stringify(default_delivery_days) : null,
        items ? JSON.stringify(items) : null,
        discount_percentage,
        max_reschedules_per_delivery,
        is_active,
        coming_soon,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    res.json({
      message: 'Subscription plan updated successfully',
      plan: result.rows[0],
    });
  } catch (error) {
    console.error('Update subscription plan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete subscription plan (Admin)
const deleteSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if plan has active subscriptions
    const activeSubsResult = await db.query(
      'SELECT COUNT(*) FROM user_plans WHERE plan_id = $1 AND status = $2',
      [id, 'active']
    );

    if (parseInt(activeSubsResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete plan with active subscriptions. Deactivate it instead.' 
      });
    }

    const result = await db.query(
      'DELETE FROM subscription_plans WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    res.json({ message: 'Subscription plan deleted successfully' });
  } catch (error) {
    console.error('Delete subscription plan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get subscription analytics (Admin)
const getSubscriptionAnalytics = async (req, res) => {
  try {
    const { period = 30 } = req.query;

    // Summary stats
    const summaryResult = await db.query(`
      SELECT 
        COUNT(DISTINCT up.id) as total_subscriptions,
        COUNT(DISTINCT up.id) FILTER (WHERE up.status = 'active') as active_subscriptions,
        COUNT(DISTINCT up.id) FILTER (WHERE up.status = 'paused') as paused_subscriptions,
        COUNT(DISTINCT up.id) FILTER (WHERE up.status = 'cancelled') as cancelled_subscriptions,
        SUM(up.payment_amount) as total_revenue,
        AVG(up.payment_amount) as avg_subscription_value,
        COUNT(DISTINCT pd.id) FILTER (WHERE pd.status = 'completed') as total_deliveries_completed,
        COUNT(DISTINCT pd.id) FILTER (WHERE pd.status = 'skipped') as total_deliveries_skipped
      FROM user_plans up
      LEFT JOIN plan_deliveries pd ON up.id = pd.user_plan_id
      WHERE up.created_at >= CURRENT_DATE - INTERVAL '${period} days'
    `);

    // Popular plans
    const popularPlansResult = await db.query(`
      SELECT sp.name, sp.price, COUNT(up.id) as subscription_count, SUM(up.payment_amount) as revenue
      FROM subscription_plans sp
      LEFT JOIN user_plans up ON sp.id = up.plan_id
      WHERE up.created_at >= CURRENT_DATE - INTERVAL '${period} days'
      GROUP BY sp.id, sp.name, sp.price
      ORDER BY subscription_count DESC
      LIMIT 10
    `);

    // Subscription trend
    const trendResult = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as subscriptions
      FROM user_plans
      WHERE created_at >= CURRENT_DATE - INTERVAL '${period} days'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `);

    res.json({
      summary: {
        ...summaryResult.rows[0],
        total_revenue: parseFloat(summaryResult.rows[0].total_revenue || 0),
        avg_subscription_value: parseFloat(summaryResult.rows[0].avg_subscription_value || 0),
      },
      popular_plans: popularPlansResult.rows.map(p => ({
        ...p,
        price: parseFloat(p.price),
        revenue: parseFloat(p.revenue || 0),
      })),
      subscription_trend: trendResult.rows,
    });
  } catch (error) {
    console.error('Get subscription analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Process deliveries - Create orders for tomorrow's deliveries (Admin/Cron)
const processDeliveries = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const { date } = req.query;
    const targetDate = date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Tomorrow

    await client.query('BEGIN');

    // Get all deliveries scheduled for target date that need orders created
    const deliveriesResult = await client.query(
      `SELECT pd.*, up.user_id, up.locked_items, sp.name as plan_name
       FROM plan_deliveries pd
       JOIN user_plans up ON pd.user_plan_id = up.id
       JOIN subscription_plans sp ON up.plan_id = sp.id
       WHERE pd.scheduled_date = $1 
       AND pd.status = 'scheduled' 
       AND up.status = 'active'
       AND pd.order_id IS NULL`,
      [targetDate]
    );

    const ordersCreated = [];

    for (const delivery of deliveriesResult.rows) {
      // Calculate order total from locked items
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

      // Update delivery status and link order
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

      ordersCreated.push({
        delivery_id: delivery.id,
        order_id: order.id,
        user_id: delivery.user_id,
        total: total,
      });
    }

    await client.query('COMMIT');

    res.json({
      message: `Successfully processed ${ordersCreated.length} deliveries`,
      date: targetDate,
      orders_created: ordersCreated,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Process deliveries error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

module.exports = {
  // Customer functions
  getSubscriptionPlans,
  purchasePlan,
  getMySubscriptions,
  getSubscriptionCalendar,
  skipDelivery,
  rescheduleDelivery,
  pausePlan,
  resumePlan,
  cancelPlan,
  generateDeliverySchedule,
  
  // Admin functions
  getAllSubscriptions,
  getAllSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getSubscriptionAnalytics,
  processDeliveries,
};
