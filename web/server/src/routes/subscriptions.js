const express = require('express');
const { query } = require('../db/config');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get all subscription plans (public)
router.get('/plans', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, slug, description, price, original_price, 
              interval, duration, features, items, is_popular
       FROM subscription_plans 
       WHERE is_active = true 
       ORDER BY price ASC`
    );

    // Transform for frontend compatibility
    const plans = result.rows.map(plan => ({
      id: plan.slug, // Use slug as ID for compatibility
      dbId: plan.id,
      name: plan.name,
      price: parseFloat(plan.price),
      originalPrice: parseFloat(plan.original_price),
      interval: plan.interval,
      duration: plan.duration,
      description: plan.description,
      features: plan.features || [],
      items: plan.items || [],
      popular: plan.is_popular
    }));

    res.json({ plans });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ message: 'Failed to fetch subscription plans' });
  }
});

// Get single plan
router.get('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const isNumeric = /^\d+$/.test(id);
    const result = await query(
      `SELECT * FROM subscription_plans WHERE ${isNumeric ? 'id = $1' : 'slug = $1'} AND is_active = true`,
      [isNumeric ? parseInt(id) : id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    res.json({ plan: result.rows[0] });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({ message: 'Failed to fetch plan' });
  }
});

// Get user's active subscription
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT us.*, sp.name as plan_name, sp.description as plan_description,
              sp.price, sp.interval, sp.features, sp.items
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.plan_id = sp.id
       WHERE us.user_id = $1 AND us.status IN ('active', 'paused')
       ORDER BY us.created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({ subscription: null });
    }

    res.json({ subscription: result.rows[0] });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ message: 'Failed to fetch subscription' });
  }
});

// Get user's subscription history
router.get('/history', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT us.*, sp.name as plan_name, sp.price
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.plan_id = sp.id
       WHERE us.user_id = $1
       ORDER BY us.created_at DESC`,
      [req.user.id]
    );

    res.json({ subscriptions: result.rows });
  } catch (error) {
    console.error('Get subscription history error:', error);
    res.status(500).json({ message: 'Failed to fetch subscription history' });
  }
});

// Purchase/Subscribe to a plan
router.post('/purchase', authenticate, async (req, res) => {
  try {
    const { plan_id, delivery_address, start_date } = req.body;

    if (!plan_id) {
      return res.status(400).json({ message: 'Plan ID is required' });
    }

    // Get plan details
    const isNumeric = /^\d+$/.test(plan_id);
    const planResult = await query(
      `SELECT * FROM subscription_plans WHERE ${isNumeric ? 'id = $1' : 'slug = $1'} AND is_active = true`,
      [isNumeric ? parseInt(plan_id) : plan_id]
    );

    if (planResult.rows.length === 0) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const plan = planResult.rows[0];

    // Calculate dates
    const subscriptionStart = start_date ? new Date(start_date) : new Date();
    let subscriptionEnd = new Date(subscriptionStart);
    
    switch (plan.interval) {
      case 'week':
        subscriptionEnd.setDate(subscriptionEnd.getDate() + 7);
        break;
      case '15 days':
        subscriptionEnd.setDate(subscriptionEnd.getDate() + 15);
        break;
      case 'month':
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
        break;
      default:
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
    }

    // Get user address if not provided
    let address = delivery_address;
    if (!address) {
      const userResult = await query('SELECT address, city, state, pincode FROM users WHERE id = $1', [req.user.id]);
      if (userResult.rows[0]) {
        const user = userResult.rows[0];
        address = `${user.address || ''}, ${user.city || ''}, ${user.state || ''} - ${user.pincode || ''}`.trim();
      }
    }

    // Create subscription
    const result = await query(
      `INSERT INTO user_subscriptions (user_id, plan_id, start_date, end_date, next_delivery, delivery_address, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'paid')
       RETURNING *`,
      [req.user.id, plan.id, subscriptionStart, subscriptionEnd, subscriptionStart, address]
    );

    // Schedule first delivery
    await query(
      `INSERT INTO delivery_calendar (user_id, subscription_id, delivery_date, status)
       VALUES ($1, $2, $3, 'scheduled')`,
      [req.user.id, result.rows[0].id, subscriptionStart]
    );

    res.status(201).json({
      message: 'Subscription activated successfully',
      subscription: {
        ...result.rows[0],
        plan_name: plan.name,
        plan_price: plan.price
      }
    });
  } catch (error) {
    console.error('Purchase subscription error:', error);
    res.status(500).json({ message: 'Failed to create subscription' });
  }
});

// Cancel subscription
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE user_subscriptions 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND status = 'active'
       RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Active subscription not found' });
    }

    res.json({
      message: 'Subscription cancelled',
      subscription: result.rows[0]
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Failed to cancel subscription' });
  }
});

// Pause subscription
router.post('/:id/pause', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE user_subscriptions 
       SET status = 'paused', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND status = 'active'
       RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Active subscription not found' });
    }

    res.json({
      message: 'Subscription paused',
      subscription: result.rows[0]
    });
  } catch (error) {
    console.error('Pause subscription error:', error);
    res.status(500).json({ message: 'Failed to pause subscription' });
  }
});

// Resume subscription
router.post('/:id/resume', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE user_subscriptions 
       SET status = 'active', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND status = 'paused'
       RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Paused subscription not found' });
    }

    res.json({
      message: 'Subscription resumed',
      subscription: result.rows[0]
    });
  } catch (error) {
    console.error('Resume subscription error:', error);
    res.status(500).json({ message: 'Failed to resume subscription' });
  }
});

module.exports = router;
