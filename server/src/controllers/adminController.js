const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');

// Default admin credentials
const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admin123', // Will be hashed
  email: 'admin@ruralbowl.com',
  role: 'admin'
};

// Admin Login
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Check if admin exists in database (search by email or username)
    let result = await db.query(
      'SELECT * FROM users WHERE (email = $1 OR name = $1) AND role = $2', 
      [username, 'admin']
    );
    
    // If no admin exists and trying default admin, create it
    if (result.rows.length === 0 && username === DEFAULT_ADMIN.username) {
      // Check if email already exists (might be created as customer)
      const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [DEFAULT_ADMIN.email]);
      
      if (existingUser.rows.length > 0) {
        // Update existing user to admin
        const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
        result = await db.query(
          'UPDATE users SET role = $1, password = $2 WHERE email = $3 RETURNING *',
          ['admin', hashedPassword, DEFAULT_ADMIN.email]
        );
      } else {
        // Create new admin
        const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
        result = await db.query(
          'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
          ['Admin User', DEFAULT_ADMIN.email, hashedPassword, 'admin']
        );
      }
    }

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const admin = result.rows[0];

    // Check if user is admin
    if (admin.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Dashboard Statistics
const getDashboardStats = async (req, res) => {
  try {
    // Total users
    const usersResult = await db.query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['customer']);
    
    // Total orders
    const ordersResult = await db.query('SELECT COUNT(*) as count FROM orders');
    
    // Total revenue
    const revenueResult = await db.query('SELECT SUM(total_amount) as total FROM orders WHERE status != $1', ['cancelled']);
    
    // Pending orders
    const pendingOrdersResult = await db.query('SELECT COUNT(*) as count FROM orders WHERE status = $1', ['pending']);
    
    // Low stock products
    const lowStockResult = await db.query('SELECT COUNT(*) as count FROM products WHERE stock_quantity < 10 AND is_available = true');
    
    // Recent orders
    const recentOrdersResult = await db.query(`
      SELECT o.*, u.name as user_name, u.email as user_email 
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC 
      LIMIT 10
    `);

    // Top selling products
    const topProductsResult = await db.query(`
      SELECT p.id, p.name, p.price, p.image_url, SUM(oi.quantity) as total_sold, SUM(oi.price * oi.quantity) as revenue
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    // Sales by day (last 7 days)
    const salesByDayResult = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(total_amount) as revenue
      FROM orders
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' AND status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    res.json({
      stats: {
        totalUsers: parseInt(usersResult.rows[0].count),
        totalOrders: parseInt(ordersResult.rows[0].count),
        totalRevenue: parseFloat(revenueResult.rows[0].total || 0),
        pendingOrders: parseInt(pendingOrdersResult.rows[0].count),
        lowStockProducts: parseInt(lowStockResult.rows[0].count)
      },
      recentOrders: recentOrdersResult.rows,
      topProducts: topProductsResult.rows,
      salesByDay: salesByDayResult.rows
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get All Users
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, name, email, phone, address, role, created_at FROM users WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (role) {
      query += ` AND role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
    const countParams = [];
    let countParamCount = 1;

    if (search) {
      countQuery += ` AND (name ILIKE $${countParamCount} OR email ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }

    if (role) {
      countQuery += ` AND role = $${countParamCount}`;
      countParams.push(role);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      users: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get User Details with Orders
const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await db.query(
      'SELECT id, name, email, phone, address, role, created_at FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const ordersResult = await db.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [id]
    );

    res.json({
      user: userResult.rows[0],
      orders: ordersResult.rows
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update User
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, role } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      params.push(name);
      paramCount++;
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount}`);
      params.push(email);
      paramCount++;
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount}`);
      params.push(phone);
      paramCount++;
    }
    if (address !== undefined) {
      updates.push(`address = $${paramCount}`);
      params.push(address);
      paramCount++;
    }
    if (role !== undefined) {
      updates.push(`role = $${paramCount}`);
      params.push(role);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const result = await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, name, email, phone, address, role, created_at`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Get All Orders
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '', search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT o.*, u.name as user_name, u.email as user_email 
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND o.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (search) {
      query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR CAST(o.id AS TEXT) LIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM orders o JOIN users u ON o.user_id = u.id WHERE 1=1';
    const countParams = [];
    let countParamCount = 1;

    if (status) {
      countQuery += ` AND o.status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }

    if (search) {
      countQuery += ` AND (u.name ILIKE $${countParamCount} OR u.email ILIKE $${countParamCount} OR CAST(o.id AS TEXT) LIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      orders: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Single Order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get order details with user information
    const orderQuery = `
      SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      WHERE o.id = $1
    `;
    const orderResult = await db.query(orderQuery, [id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Get order items with product details
    const itemsQuery = `
      SELECT 
        oi.*,
        p.name,
        p.slug,
        p.image_url,
        p.unit
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
      ORDER BY oi.id
    `;
    const itemsResult = await db.query(itemsQuery, [id]);

    res.json({
      order,
      items: itemsResult.rows
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Order Status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const result = await db.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = result.rows[0];

    // Send appropriate email based on status
    try {
      // Get user details
      const userResult = await db.query('SELECT * FROM users WHERE id = $1', [order.user_id]);
      const user = userResult.rows[0];

      if (user) {
        const orderWithNumber = {
          ...order,
          order_number: `RB${String(order.id).padStart(6, '0')}`,
        };
        
        // Send different emails based on status
        if (status === 'shipped') {
          // Send shipping notification with tracking info
          const trackingDetails = {
            trackingNumber: orderWithNumber.order_number,
            estimatedDelivery: 'Within 2-3 business days'
          };
          await emailService.sendShippingNotification(user.email, orderWithNumber, user, trackingDetails);
          console.log('\\u2705 Shipping notification sent to:', user.email);
        } else if (status === 'delivered') {
          // Send delivery confirmation
          await emailService.sendDeliveryConfirmation(user.email, orderWithNumber, user);
          console.log('\\u2705 Delivery confirmation sent to:', user.email);
        } else if (status === 'cancelled') {
          // Send cancellation email
          await emailService.sendOrderCancellation(user.email, orderWithNumber, user, req.body.cancellation_reason);
          console.log('\\u2705 Cancellation email sent to:', user.email);
        } else {
          // Generic status update for other statuses
          await emailService.sendOrderStatusUpdate(user.email, orderWithNumber, user, status);
          console.log('\\u2705 Order status email sent to:', user.email);
        }
      }
    } catch (emailError) {
      console.error('\u26a0\ufe0f Failed to send status update email:', emailError.message);
      // Don't fail the status update if email fails
    }

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get All Products (Admin)
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', category = '', availability = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND p.name ILIKE $${paramCount}`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (category) {
      query += ` AND p.category_id = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (availability === 'available') {
      query += ` AND p.is_available = true AND p.stock_quantity > 0`;
    } else if (availability === 'out_of_stock') {
      query += ` AND (p.is_available = false OR p.stock_quantity = 0)`;
    } else if (availability === 'low_stock') {
      query += ` AND p.stock_quantity < 10 AND p.stock_quantity > 0`;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM products p WHERE 1=1';
    const countParams = [];
    let countParamCount = 1;

    if (search) {
      countQuery += ` AND p.name ILIKE $${countParamCount}`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }

    if (category) {
      countQuery += ` AND p.category_id = $${countParamCount}`;
      countParams.push(category);
      countParamCount++;
    }

    if (availability === 'available') {
      countQuery += ` AND p.is_available = true AND p.stock_quantity > 0`;
    } else if (availability === 'out_of_stock') {
      countQuery += ` AND (p.is_available = false OR p.stock_quantity = 0)`;
    } else if (availability === 'low_stock') {
      countQuery += ` AND p.stock_quantity < 10 AND p.stock_quantity > 0`;
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      products: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create Product
const createProduct = async (req, res) => {
  try {
    const { name, slug, description, price, unit, category_id, image_url, stock_quantity, is_available } = req.body;

    if (!name || !price || !unit || !category_id) {
      return res.status(400).json({ message: 'Name, price, unit, and category are required' });
    }

    const productSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const result = await db.query(
      `INSERT INTO products (name, slug, description, price, unit, category_id, image_url, stock_quantity, is_available) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [name, productSlug, description, price, unit, category_id, image_url, stock_quantity || 0, is_available !== false]
    );

    res.status(201).json({
      message: 'Product created successfully',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Create product error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ message: 'Product slug already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Product By ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ product: result.rows[0] });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, price, unit, category_id, image_url, stock_quantity, is_available } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      params.push(name);
      paramCount++;
    }
    if (slug !== undefined) {
      updates.push(`slug = $${paramCount}`);
      params.push(slug);
      paramCount++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      params.push(description);
      paramCount++;
    }
    if (price !== undefined) {
      updates.push(`price = $${paramCount}`);
      params.push(price);
      paramCount++;
    }
    if (unit !== undefined) {
      updates.push(`unit = $${paramCount}`);
      params.push(unit);
      paramCount++;
    }
    if (category_id !== undefined) {
      updates.push(`category_id = $${paramCount}`);
      params.push(category_id);
      paramCount++;
    }
    if (image_url !== undefined) {
      updates.push(`image_url = $${paramCount}`);
      params.push(image_url);
      paramCount++;
    }
    if (stock_quantity !== undefined) {
      updates.push(`stock_quantity = $${paramCount}`);
      params.push(stock_quantity);
      paramCount++;
    }
    if (is_available !== undefined) {
      updates.push(`is_available = $${paramCount}`);
      params.push(is_available);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const query = `UPDATE products SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      message: 'Product updated successfully',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Update product error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Product slug already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete Product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Stock
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_quantity } = req.body;

    if (stock_quantity === undefined || stock_quantity < 0) {
      return res.status(400).json({ message: 'Valid stock quantity required' });
    }

    const result = await db.query(
      `UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 RETURNING p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = $2`,
      [stock_quantity, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = result.rows[0];

    // Send low stock alert if stock is below threshold
    const LOW_STOCK_THRESHOLD = 10;
    if (stock_quantity > 0 && stock_quantity <= LOW_STOCK_THRESHOLD) {
      try {
        await emailService.sendLowStockAlert(product);
        console.log(`⚠️ Low stock alert sent for: ${product.name} (${stock_quantity} units)`);
      } catch (emailError) {
        console.error('Failed to send low stock alert:', emailError.message);
        // Don't fail the stock update if email fails
      }
    }

    res.json({
      message: 'Stock updated successfully',
      product
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get All Categories
const getAllCategories = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*, COUNT(p.id) as product_count 
       FROM categories c 
       LEFT JOIN products p ON c.id = p.category_id 
       GROUP BY c.id 
       ORDER BY c.name ASC`
    );

    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Category By ID
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT c.*, COUNT(p.id) as product_count 
       FROM categories c 
       LEFT JOIN products p ON c.id = p.category_id 
       WHERE c.id = $1 
       GROUP BY c.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ category: result.rows[0] });
  } catch (error) {
    console.error('Get category by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create Category
const createCategory = async (req, res) => {
  try {
    const { name, slug, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const categorySlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const result = await db.query(
      'INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3) RETURNING *',
      [name, categorySlug, description]
    );

    res.status(201).json({
      message: 'Category created successfully',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Category slug already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      params.push(name);
      paramCount++;
    }
    if (slug !== undefined) {
      updates.push(`slug = $${paramCount}`);
      params.push(slug);
      paramCount++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      params.push(description);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const result = await db.query(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({
      message: 'Category updated successfully',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Update category error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Category slug already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete Category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has products
    const productsResult = await db.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = $1',
      [id]
    );

    if (parseInt(productsResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with existing products. Please reassign or delete products first.' 
      });
    }

    const result = await db.query(
      'DELETE FROM categories WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  adminLogin,
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  updateUser,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
