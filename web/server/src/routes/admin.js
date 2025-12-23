const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../db/config');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Admin login
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { username, password } = req.body;

    const result = await query(
      'SELECT * FROM admin_users WHERE username = $1 AND is_active = true',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    const isValid = await bcrypt.compare(password, admin.password);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { adminId: admin.id, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Protected admin routes below
router.use(authenticateAdmin);

// Dashboard stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [users, products, orders, revenue] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users'),
      query('SELECT COUNT(*) as count FROM products WHERE is_active = true'),
      query('SELECT COUNT(*) as count FROM orders'),
      query('SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE payment_status = \'paid\''),
    ]);

    // Recent orders
    const recentOrders = await query(
      `SELECT o.id, o.order_number, o.total, o.status, o.created_at, u.name as customer_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 5`
    );

    // Orders by status
    const ordersByStatus = await query(
      `SELECT status, COUNT(*) as count FROM orders GROUP BY status`
    );

    res.json({
      stats: {
        totalUsers: parseInt(users.rows[0].count),
        totalProducts: parseInt(products.rows[0].count),
        totalOrders: parseInt(orders.rows[0].count),
        totalRevenue: parseFloat(revenue.rows[0].total)
      },
      recentOrders: recentOrders.rows,
      ordersByStatus: ordersByStatus.rows
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// Users management
router.get('/users', async (req, res) => {
  try {
    const { search, limit = 50, offset = 0 } = req.query;

    let sql = 'SELECT id, name, email, phone, city, created_at FROM users';
    const params = [];
    let paramIndex = 1;

    if (search) {
      sql += ` WHERE name ILIKE $${paramIndex} OR email ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);
    const countResult = await query('SELECT COUNT(*) FROM users');

    res.json({
      users: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT u.*, 
              (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count,
              (SELECT COALESCE(SUM(total), 0) FROM orders WHERE user_id = u.id) as total_spent
       FROM users u WHERE u.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove password from response
    const user = result.rows[0];
    delete user.password;

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Products management
router.get('/products', async (req, res) => {
  try {
    const { category, search, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (category) {
      sql += ` AND p.category_id = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      sql += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);

    res.json({ products: result.rows });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ product: result.rows[0] });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

router.post('/products', async (req, res) => {
  try {
    const { name, description, price, original_price, unit, stock_quantity, category_id, image_url, is_featured } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const result = await query(
      `INSERT INTO products (name, slug, description, price, original_price, unit, stock_quantity, category_id, image_url, is_featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [name, slug, description, price, original_price, unit || 'kg', stock_quantity || 0, category_id, image_url, is_featured || false]
    );

    res.status(201).json({
      message: 'Product created',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Failed to create product' });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const { name, description, price, original_price, unit, stock_quantity, category_id, image_url, is_featured, is_active } = req.body;

    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined;

    const result = await query(
      `UPDATE products SET 
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        price = COALESCE($4, price),
        original_price = COALESCE($5, original_price),
        unit = COALESCE($6, unit),
        stock_quantity = COALESCE($7, stock_quantity),
        category_id = COALESCE($8, category_id),
        image_url = COALESCE($9, image_url),
        is_featured = COALESCE($10, is_featured),
        is_active = COALESCE($11, is_active),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
      [name, slug, description, price, original_price, unit, stock_quantity, category_id, image_url, is_featured, is_active, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      message: 'Product updated',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const result = await query(
      'UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

// Categories management
router.get('/categories', async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = true) as product_count
       FROM categories c
       ORDER BY c.name`
    );
    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const { name, description, image_url } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const result = await query(
      'INSERT INTO categories (name, slug, description, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, slug, description, image_url]
    );

    res.status(201).json({
      message: 'Category created',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Failed to create category' });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const { name, description, image_url, is_active } = req.body;

    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined;

    const result = await query(
      `UPDATE categories SET 
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        image_url = COALESCE($4, image_url),
        is_active = COALESCE($5, is_active),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, slug, description, image_url, is_active, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({
      message: 'Category updated',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Failed to update category' });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    // Check if category has products
    const productsCheck = await query('SELECT COUNT(*) FROM products WHERE category_id = $1 AND is_active = true', [req.params.id]);
    
    if (parseInt(productsCheck.rows[0].count) > 0) {
      return res.status(400).json({ message: 'Cannot delete category with active products' });
    }

    const result = await query(
      'UPDATE categories SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Failed to delete category' });
  }
});

// Orders management
router.get('/orders', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT o.*, u.name as customer_name, u.email as customer_email,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      sql += ` WHERE o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    sql += ` ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);

    res.json({ orders: result.rows });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const result = await query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      message: 'Order status updated',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

// Subscription Plans management
router.get('/subscription-plans', async (req, res) => {
  try {
    const result = await query('SELECT * FROM subscription_plans ORDER BY price ASC');
    res.json({ plans: result.rows });
  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({ message: 'Failed to fetch subscription plans' });
  }
});

router.post('/subscription-plans', async (req, res) => {
  try {
    const { name, description, price, original_price, interval, duration, features, items, is_popular } = req.body;

    if (!name || !price || !interval || !duration) {
      return res.status(400).json({ message: 'Name, price, interval, and duration are required' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const result = await query(
      `INSERT INTO subscription_plans (name, slug, description, price, original_price, interval, duration, features, items, is_popular)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [name, slug, description, price, original_price, interval, duration, features || [], items || [], is_popular || false]
    );

    res.status(201).json({
      message: 'Subscription plan created',
      plan: result.rows[0]
    });
  } catch (error) {
    console.error('Create subscription plan error:', error);
    res.status(500).json({ message: 'Failed to create subscription plan' });
  }
});

router.put('/subscription-plans/:id', async (req, res) => {
  try {
    const { name, description, price, original_price, interval, duration, features, items, is_popular, is_active } = req.body;

    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined;

    const result = await query(
      `UPDATE subscription_plans SET 
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        price = COALESCE($4, price),
        original_price = COALESCE($5, original_price),
        interval = COALESCE($6, interval),
        duration = COALESCE($7, duration),
        features = COALESCE($8, features),
        items = COALESCE($9, items),
        is_popular = COALESCE($10, is_popular),
        is_active = COALESCE($11, is_active),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
      [name, slug, description, price, original_price, interval, duration, features, items, is_popular, is_active, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    res.json({
      message: 'Subscription plan updated',
      plan: result.rows[0]
    });
  } catch (error) {
    console.error('Update subscription plan error:', error);
    res.status(500).json({ message: 'Failed to update subscription plan' });
  }
});

router.delete('/subscription-plans/:id', async (req, res) => {
  try {
    const result = await query(
      'UPDATE subscription_plans SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    res.json({ message: 'Subscription plan deleted' });
  } catch (error) {
    console.error('Delete subscription plan error:', error);
    res.status(500).json({ message: 'Failed to delete subscription plan' });
  }
});

module.exports = router;
