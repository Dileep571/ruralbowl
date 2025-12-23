const db = require('../config/database');

// Get Delivery Calendar
const getDeliveryCalendar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    let query = `
      SELECT 
        pd.id,
        pd.scheduled_date as delivery_date,
        pd.delivery_time_slot as time_slot,
        pd.status,
        pd.locked_items,
        pd.custom_items,
        pd.notes,
        up.id as user_plan_id,
        up.plan_id,
        sp.name as plan_name,
        sp.description,
        sp.items as plan_items
      FROM plan_deliveries pd
      JOIN user_plans up ON pd.user_plan_id = up.id
      JOIN subscription_plans sp ON up.plan_id = sp.id
      WHERE up.user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM pd.scheduled_date) = $${paramIndex} AND EXTRACT(YEAR FROM pd.scheduled_date) = $${paramIndex + 1}`;
      params.push(month, year);
      paramIndex += 2;
    }

    query += ` ORDER BY pd.scheduled_date ASC`;

    const result = await db.query(query, params);

    res.json({ deliveries: result.rows });
  } catch (error) {
    console.error('Get delivery calendar error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add Delivery Schedule (for one-time deliveries - optional feature)
const addDeliverySchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { delivery_date, items, notes, time_slot } = req.body;

    // This would create a one-time delivery not tied to a subscription
    // For now, return a message that this should be done through subscriptions
    res.status(400).json({ 
      message: 'Please purchase a subscription plan to schedule deliveries',
      redirect: '/subscriptions'
    });
  } catch (error) {
    console.error('Add delivery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Delivery Status
const updateDeliveryStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    // Verify the delivery belongs to the user
    const checkResult = await db.query(
      `SELECT pd.* FROM plan_deliveries pd
       JOIN user_plans up ON pd.user_plan_id = up.id
       WHERE pd.id = $1 AND up.user_id = $2`,
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    const result = await db.query(
      'UPDATE plan_deliveries SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    res.json({
      message: 'Delivery status updated',
      delivery: result.rows[0],
    });
  } catch (error) {
    console.error('Update delivery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Subscription Plans
const getSubscriptionPlans = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price');
    res.json({ plans: result.rows });
  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get User Subscription
const getUserSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT up.*, sp.name as plan_name, sp.description, sp.items as features,
              COUNT(pd.id) FILTER (WHERE pd.status = 'completed') as completed_deliveries,
              COUNT(pd.id) FILTER (WHERE pd.status = 'scheduled') as upcoming_deliveries
       FROM user_plans up 
       JOIN subscription_plans sp ON up.plan_id = sp.id 
       LEFT JOIN plan_deliveries pd ON up.id = pd.user_plan_id
       WHERE up.user_id = $1 AND up.status = 'active' AND up.expiry_date > CURRENT_DATE 
       GROUP BY up.id, sp.name, sp.description, sp.items
       ORDER BY up.created_at DESC 
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ subscription: null });
    }

    res.json({ subscription: result.rows[0] });
  } catch (error) {
    console.error('Get user subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Subscribe to Plan (redirect to proper subscription purchase endpoint)
const subscribeToPlan = async (req, res) => {
  try {
    // This endpoint is deprecated - use /api/subscriptions/purchase instead
    res.status(400).json({ 
      message: 'Please use /api/subscriptions/purchase to purchase subscriptions',
      redirect: '/api/subscriptions/purchase'
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDeliveryCalendar,
  addDeliverySchedule,
  updateDeliveryStatus,
  getSubscriptionPlans,
  getUserSubscription,
  subscribeToPlan,
};
