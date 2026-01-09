const db = require('../config/database');
const emailService = require('../services/emailService');
const couponController = require('./couponController');
const { calculateDeliveryDate } = require('./deliveryController');

// Create Order
const createOrder = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const userId = req.user.id;
    const { shipping_address, payment_method, notes, coupon_code, delivery_area_id } = req.body;

    // Validate delivery area
    if (!delivery_area_id) {
      return res.status(400).json({ 
        message: 'Please select a delivery area',
        field: 'delivery_area_id'
      });
    }

    await client.query('BEGIN');

    // Check if delivery area is active
    const areaCheck = await client.query(
      'SELECT * FROM delivery_areas WHERE id = $1 AND is_active = TRUE',
      [delivery_area_id]
    );

    if (areaCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'Delivery not available in selected area' 
      });
    }

    // Calculate expected delivery date based on current time
    const expectedDeliveryDate = calculateDeliveryDate();

    // Get cart items with stock info
    const cartItems = await client.query(
      `SELECT c.*, p.price, p.name, p.stock_quantity 
       FROM cart c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.user_id = $1`,
      [userId]
    );

    if (cartItems.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Validate stock availability for all items
    for (const item of cartItems.rows) {
      if (item.quantity > item.stock_quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.name}. Only ${item.stock_quantity} units available.`,
          product: item.name,
          requested: item.quantity,
          available: item.stock_quantity
        });
      }
    }

    // Calculate subtotal
    const subtotal = cartItems.rows.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

    // Apply coupon if provided
    let couponId = null;
    let discountAmount = 0;
    let totalAmount = subtotal;

    if (coupon_code) {
      try {
        const validationResult = await couponController.validateCouponInternal(
          coupon_code, 
          subtotal, 
          userId, 
          client
        );

        if (validationResult.valid) {
          couponId = validationResult.coupon.id;
          discountAmount = validationResult.discount;
          totalAmount = subtotal - discountAmount;
        }
      } catch (couponError) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          message: couponError.message || 'Invalid coupon code'
        });
      }
    }

    // Create order with delivery information
    const orderResult = await client.query(
      `INSERT INTO orders (
        user_id, subtotal, discount_amount, total_amount, coupon_id, 
        shipping_address, payment_method, notes, 
        delivery_area_id, expected_delivery_date
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        userId, subtotal, discountAmount, totalAmount, couponId, 
        shipping_address, payment_method, notes, 
        delivery_area_id, expectedDeliveryDate
      ]
    );

    const order = orderResult.rows[0];

    // Record coupon usage if applied
    if (couponId) {
      await couponController.applyCouponInternal(couponId, userId, order.id, client);
    }

    // Create order items and deduct stock
    for (const item of cartItems.rows) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [order.id, item.product_id, item.quantity, item.price]
      );

      // Deduct stock quantity
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    // Clear cart
    await client.query('DELETE FROM cart WHERE user_id = $1', [userId]);

    await client.query('COMMIT');

    // Send order confirmation and payment confirmation emails
    try {
      // Get user details
      const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
      const user = userResult.rows[0];

      // Prepare order with items for email
      const orderWithItems = {
        ...order,
        order_number: `RB${String(order.id).padStart(6, '0')}`,
        items: cartItems.rows.map(item => ({
          product_name: item.name,
          quantity: item.quantity,
          price: parseFloat(item.price) * item.quantity,
        })),
      };

      // Send order confirmation email (this includes all order details)
      await emailService.sendOrderConfirmation(user.email, orderWithItems, user);
      console.log('\u2705 Order confirmation email sent to:', user.email);
      
      // Only send payment confirmation email for prepaid orders (not COD)
      // COD payment will be confirmed when actually received
      if (order.payment_method !== 'cod' && order.payment_status === 'paid') {
        await emailService.sendPaymentConfirmation(user.email, orderWithItems, user);
        console.log('\u2705 Payment confirmation email sent to:', user.email);
      }
      
      // Send new order alert to admin
      await emailService.sendNewOrderAlert(orderWithItems, user);
      console.log('\u2705 New order alert sent to admin');
    } catch (emailError) {
      console.error('\u26a0\ufe0f Failed to send order emails:', emailError.message);
      // Don't fail the order if email fails
    }

    res.status(201).json({
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create order error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    client.release();
  }
};

// Get User Orders
const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT o.*, 
       da.area_name as delivery_area_name,
       da.city as delivery_city,
       COUNT(oi.id) as items_count 
       FROM orders o 
       LEFT JOIN order_items oi ON o.id = oi.order_id 
       LEFT JOIN delivery_areas da ON o.delivery_area_id = da.id
       WHERE o.user_id = $1 
       GROUP BY o.id, da.area_name, da.city
       ORDER BY o.created_at DESC`,
      [userId]
    );

    res.json({ orders: result.rows });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Single Order
const getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const orderResult = await db.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const itemsResult = await db.query(
      `SELECT oi.*, p.name, p.unit, p.image_url 
       FROM order_items oi 
       LEFT JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = $1`,
      [id]
    );

    res.json({
      order: orderResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Order Status (Admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_status } = req.body;

    const result = await db.query(
      `UPDATE orders 
       SET status = $1, payment_status = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING *`,
      [status, payment_status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      message: 'Order updated successfully',
      order: result.rows[0],
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get All Orders (Admin)
const getAllOrders = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT o.*, u.name as user_name, u.email as user_email,
      da.area_name as delivery_area_name,
      da.city as delivery_city,
      COUNT(oi.id) as items_count 
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN delivery_areas da ON o.delivery_area_id = da.id
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` WHERE o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` GROUP BY o.id, u.name, u.email, da.area_name, da.city ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({ orders: result.rows });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
};
