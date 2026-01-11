const db = require('../config/database');

// Get dashboard analytics
const getDashboardAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const daysAgo = parseInt(period);

    // Total revenue
    const revenueResult = await db.query(
      `SELECT 
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(SUM(discount), 0) as total_discounts,
        COUNT(*) as total_orders
       FROM orders 
       WHERE status != 'cancelled' 
       AND created_at >= NOW() - INTERVAL '${daysAgo} days'`
    );

    // Orders by status
    const statusResult = await db.query(
      `SELECT status, COUNT(*) as count
       FROM orders
       WHERE created_at >= NOW() - INTERVAL '${daysAgo} days'
       GROUP BY status`
    );

    // Revenue trend (daily)
    const trendResult = await db.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        SUM(total) as revenue
       FROM orders
       WHERE status != 'cancelled'
       AND created_at >= NOW() - INTERVAL '${daysAgo} days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`
    );

    // Top selling products
    const topProductsResult = await db.query(
      `SELECT 
        p.id,
        p.name,
        p.price,
        SUM(oi.quantity) as total_sold,
        SUM(oi.unit_price * oi.quantity) as revenue
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status != 'cancelled'
       AND o.created_at >= NOW() - INTERVAL '${daysAgo} days'
       GROUP BY p.id, p.name, p.price
       ORDER BY total_sold DESC
       LIMIT 10`
    );

    // New customers
    const customersResult = await db.query(
      `SELECT COUNT(*) as new_customers
       FROM users
       WHERE role = 'customer'
       AND created_at >= NOW() - INTERVAL '${daysAgo} days'`
    );

    // Average order value
    const avgOrderResult = await db.query(
      `SELECT AVG(total) as avg_order_value
       FROM orders
       WHERE status != 'cancelled'
       AND created_at >= NOW() - INTERVAL '${daysAgo} days'`
    );

    res.json({
      summary: {
        totalRevenue: parseFloat(revenueResult.rows[0].total_revenue || 0),
        totalDiscounts: parseFloat(revenueResult.rows[0].total_discounts || 0),
        totalOrders: parseInt(revenueResult.rows[0].total_orders || 0),
        newCustomers: parseInt(customersResult.rows[0].new_customers || 0),
        avgOrderValue: parseFloat(avgOrderResult.rows[0].avg_order_value || 0),
      },
      ordersByStatus: statusResult.rows,
      revenueTrend: trendResult.rows,
      topProducts: topProductsResult.rows,
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get sales chart data
const getSalesChart = async (req, res) => {
  try {
    const { period = '30', groupBy = 'day' } = req.query;
    const daysAgo = parseInt(period);

    let dateFormat = 'YYYY-MM-DD';
    let groupByClause = 'DATE(created_at)';

    if (groupBy === 'week') {
      dateFormat = 'YYYY-"W"IW';
      groupByClause = 'DATE_TRUNC(\'week\', created_at)';
    } else if (groupBy === 'month') {
      dateFormat = 'YYYY-MM';
      groupByClause = 'DATE_TRUNC(\'month\', created_at)';
    }

    const result = await db.query(
      `SELECT 
        TO_CHAR(${groupByClause}, '${dateFormat}') as period,
        COUNT(*) as orders,
        SUM(total) as revenue,
        SUM(discount) as discounts
       FROM orders
       WHERE status != 'cancelled'
       AND created_at >= NOW() - INTERVAL '${daysAgo} days'
       GROUP BY ${groupByClause}
       ORDER BY ${groupByClause} DESC`
    );

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Get sales chart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get category performance
const getCategoryPerformance = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = parseInt(period);

    const result = await db.query(
      `SELECT 
        c.id,
        c.name,
        COUNT(DISTINCT oi.order_id) as orders,
        SUM(oi.quantity) as items_sold,
        SUM(oi.unit_price * oi.quantity) as revenue
       FROM categories c
       JOIN products p ON c.id = p.category_id
       JOIN order_items oi ON p.id = oi.product_id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status != 'cancelled'
       AND o.created_at >= NOW() - INTERVAL '${daysAgo} days'
       GROUP BY c.id, c.name
       ORDER BY revenue DESC`
    );

    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get category performance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get customer analytics
const getCustomerAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = parseInt(period);

    // Customer growth
    const growthResult = await db.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_customers
       FROM users
       WHERE role = 'customer'
       AND created_at >= NOW() - INTERVAL '${daysAgo} days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`
    );

    // Top customers by orders
    const topCustomersResult = await db.query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(o.id) as order_count,
        SUM(o.total) as total_spent
       FROM users u
       JOIN orders o ON u.id = o.user_id
       WHERE o.status != 'cancelled'
       AND o.created_at >= NOW() - INTERVAL '${daysAgo} days'
       GROUP BY u.id, u.name, u.email
       ORDER BY total_spent DESC
       LIMIT 10`
    );

    // Customer retention (repeat customers)
    const retentionResult = await db.query(
      `SELECT 
        COUNT(DISTINCT CASE WHEN order_count > 1 THEN user_id END) as repeat_customers,
        COUNT(DISTINCT user_id) as total_customers
       FROM (
         SELECT user_id, COUNT(*) as order_count
         FROM orders
         WHERE status != 'cancelled'
         AND created_at >= NOW() - INTERVAL '${daysAgo} days'
         GROUP BY user_id
       ) AS customer_orders`
    );

    const repeatCustomers = parseInt(retentionResult.rows[0].repeat_customers || 0);
    const totalCustomers = parseInt(retentionResult.rows[0].total_customers || 0);
    const retentionRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    res.json({
      customerGrowth: growthResult.rows,
      topCustomers: topCustomersResult.rows,
      retention: {
        repeatCustomers,
        totalCustomers,
        retentionRate: parseFloat(retentionRate.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Get customer analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get product performance
const getProductPerformance = async (req, res) => {
  try {
    const { period = '30', sortBy = 'revenue' } = req.query;
    const daysAgo = parseInt(period);

    let orderByClause = 'revenue DESC';
    if (sortBy === 'quantity') orderByClause = 'total_sold DESC';
    if (sortBy === 'orders') orderByClause = 'order_count DESC';

    const result = await db.query(
      `SELECT 
        p.id,
        p.name,
        p.price,
        p.stock_quantity,
        p.average_rating,
        p.review_count,
        p.view_count,
        c.name as category_name,
        COUNT(DISTINCT oi.order_id) as order_count,
        SUM(oi.quantity) as total_sold,
        SUM(oi.unit_price * oi.quantity) as revenue
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN order_items oi ON p.id = oi.product_id
       LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
         AND o.created_at >= NOW() - INTERVAL '${daysAgo} days'
       GROUP BY p.id, p.name, p.price, p.stock_quantity, p.average_rating, 
                p.review_count, p.view_count, c.name
       ORDER BY ${orderByClause}
       LIMIT 50`
    );

    res.json({ products: result.rows });
  } catch (error) {
    console.error('Get product performance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get inventory status
const getInventoryStatus = async (req, res) => {
  try {
    const { threshold = 10 } = req.query;

    // Low stock products
    const lowStockResult = await db.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.stock_quantity <= $1 AND p.stock_quantity > 0
       ORDER BY p.stock_quantity ASC`,
      [threshold]
    );

    // Out of stock products
    const outOfStockResult = await db.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.stock_quantity = 0`
    );

    // Stock value
    const stockValueResult = await db.query(
      'SELECT SUM(stock_quantity * price) as total_stock_value FROM products'
    );

    res.json({
      lowStock: lowStockResult.rows,
      outOfStock: outOfStockResult.rows,
      totalStockValue: parseFloat(stockValueResult.rows[0].total_stock_value || 0),
    });
  } catch (error) {
    console.error('Get inventory status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get coupon analytics
const getCouponAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = parseInt(period);

    const result = await db.query(
      `SELECT 
        c.code,
        c.type,
        c.value,
        COUNT(cu.id) as usage_count,
        SUM(cu.discount_amount) as total_discount,
        COUNT(DISTINCT cu.user_id) as unique_users
       FROM coupons c
       LEFT JOIN coupon_usage cu ON c.id = cu.coupon_id
         AND cu.used_at >= NOW() - INTERVAL '${daysAgo} days'
       GROUP BY c.id, c.code, c.type, c.value
       ORDER BY total_discount DESC`
    );

    res.json({ coupons: result.rows });
  } catch (error) {
    console.error('Get coupon analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardAnalytics,
  getSalesChart,
  getCategoryPerformance,
  getCustomerAnalytics,
  getProductPerformance,
  getInventoryStatus,
  getCouponAnalytics,
};
