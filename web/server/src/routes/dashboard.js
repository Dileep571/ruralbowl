const express = require('express');
const { query } = require('../db/config');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticate);

// Get delivery calendar
router.get('/calendar', async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let sql = `
      SELECT dc.*, sp.name as plan_name
      FROM delivery_calendar dc
      LEFT JOIN user_subscriptions us ON dc.subscription_id = us.id
      LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE dc.user_id = $1
    `;
    const params = [req.user.id];
    let paramIndex = 2;

    if (month && year) {
      sql += ` AND EXTRACT(MONTH FROM dc.delivery_date) = $${paramIndex}`;
      sql += ` AND EXTRACT(YEAR FROM dc.delivery_date) = $${paramIndex + 1}`;
      params.push(parseInt(month), parseInt(year));
    }

    sql += ` ORDER BY dc.delivery_date ASC`;

    const result = await query(sql, params);

    res.json({ deliveries: result.rows });
  } catch (error) {
    console.error('Get calendar error:', error);
    res.status(500).json({ message: 'Failed to fetch calendar' });
  }
});

// Add delivery to calendar
router.post('/calendar', async (req, res) => {
  try {
    const { subscription_id, delivery_date, notes } = req.body;

    if (!delivery_date) {
      return res.status(400).json({ message: 'Delivery date is required' });
    }

    const result = await query(
      `INSERT INTO delivery_calendar (user_id, subscription_id, delivery_date, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, subscription_id || null, delivery_date, notes || null]
    );

    res.status(201).json({
      message: 'Delivery scheduled',
      delivery: result.rows[0]
    });
  } catch (error) {
    console.error('Add delivery error:', error);
    res.status(500).json({ message: 'Failed to schedule delivery' });
  }
});

// Update delivery status
router.put('/calendar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const result = await query(
      `UPDATE delivery_calendar 
       SET status = COALESCE($1, status), 
           notes = COALESCE($2, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [status, notes, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    res.json({
      message: 'Delivery updated',
      delivery: result.rows[0]
    });
  } catch (error) {
    console.error('Update delivery error:', error);
    res.status(500).json({ message: 'Failed to update delivery' });
  }
});

// Get dashboard summary
router.get('/summary', async (req, res) => {
  try {
    // Get active subscription
    const subscriptionResult = await query(
      `SELECT us.*, sp.name as plan_name, sp.price
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.plan_id = sp.id
       WHERE us.user_id = $1 AND us.status = 'active'
       LIMIT 1`,
      [req.user.id]
    );

    // Get recent orders count
    const ordersResult = await query(
      `SELECT COUNT(*) as total_orders,
              SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
              SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders
       FROM orders WHERE user_id = $1`,
      [req.user.id]
    );

    // Get upcoming deliveries
    const deliveriesResult = await query(
      `SELECT COUNT(*) as upcoming
       FROM delivery_calendar 
       WHERE user_id = $1 AND delivery_date >= CURRENT_DATE AND status = 'scheduled'`,
      [req.user.id]
    );

    res.json({
      subscription: subscriptionResult.rows[0] || null,
      orders: ordersResult.rows[0],
      upcomingDeliveries: parseInt(deliveriesResult.rows[0].upcoming)
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard summary' });
  }
});

module.exports = router;
