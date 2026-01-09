const pool = require('../config/database');

// Get product quantities needed for a specific date
async function getPreparationQuantities(req, res) {
  try {
    const { date } = req.query; // Expected format: YYYY-MM-DD
    
    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    // Query to aggregate quantities from order items for a specific date
    const query = `
      SELECT 
        p.id,
        p.name,
        p.unit,
        COALESCE(SUM(oi.quantity), 0) as total_quantity,
        COUNT(DISTINCT o.id) as order_count,
        ARRAY_AGG(DISTINCT o.id) as order_ids
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE DATE(o.created_at) = $1
        AND o.status NOT IN ('cancelled', 'refunded')
      GROUP BY p.id, p.name, p.unit
      HAVING COALESCE(SUM(oi.quantity), 0) > 0
      ORDER BY total_quantity DESC
    `;

    const result = await pool.query(query, [date]);

    res.json({
      date,
      products: result.rows,
      totalProducts: result.rows.length,
      totalOrders: result.rows.reduce((sum, p) => sum + parseInt(p.order_count), 0)
    });
  } catch (error) {
    console.error('Error fetching preparation quantities:', error);
    res.status(500).json({ error: 'Failed to fetch preparation quantities' });
  }
}

// Get quantities for multiple days (yesterday, today, tomorrow)
async function getMultiDayPreparation(req, res) {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const formatDate = (date) => date.toISOString().split('T')[0];

    const query = `
      SELECT 
        p.id,
        p.name,
        p.unit,
        p.image_url,
        DATE(o.created_at) as order_date,
        COALESCE(SUM(oi.quantity), 0) as total_quantity,
        COUNT(DISTINCT o.id) as order_count
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE DATE(o.created_at) IN ($1, $2, $3)
        AND o.status NOT IN ('cancelled', 'refunded')
      GROUP BY p.id, p.name, p.unit, p.image_url, DATE(o.created_at)
      HAVING COALESCE(SUM(oi.quantity), 0) > 0
      ORDER BY p.name, order_date
    `;

    const result = await pool.query(query, [
      formatDate(yesterday),
      formatDate(today),
      formatDate(tomorrow)
    ]);

    // Organize data by day
    const dataByDay = {
      yesterday: { date: formatDate(yesterday), products: [] },
      today: { date: formatDate(today), products: [] },
      tomorrow: { date: formatDate(tomorrow), products: [] }
    };

    result.rows.forEach(row => {
      const dateKey = 
        row.order_date === formatDate(yesterday) ? 'yesterday' :
        row.order_date === formatDate(today) ? 'today' :
        row.order_date === formatDate(tomorrow) ? 'tomorrow' : null;
      
      if (dateKey) {
        dataByDay[dateKey].products.push({
          id: row.id,
          name: row.name,
          unit: row.unit,
          image_url: row.image_url,
          total_quantity: parseFloat(row.total_quantity),
          order_count: parseInt(row.order_count)
        });
      }
    });

    res.json(dataByDay);
  } catch (error) {
    console.error('Error fetching multi-day preparation:', error);
    res.status(500).json({ error: 'Failed to fetch multi-day preparation data' });
  }
}

// Get orders placed before 6 PM for next day
async function getTomorrowOrders(req, res) {
  try {
    const now = new Date();
    const cutoffTime = new Date(now);
    cutoffTime.setHours(18, 0, 0, 0); // 6 PM today

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    // Get orders created today before 6 PM
    const query = `
      SELECT 
        p.id,
        p.name,
        p.unit,
        p.image_url,
        COALESCE(SUM(oi.quantity), 0) as total_quantity,
        COUNT(DISTINCT o.id) as order_count,
        ARRAY_AGG(DISTINCT o.id ORDER BY o.id) as order_ids
      FROM products p
      INNER JOIN order_items oi ON p.id = oi.product_id
      INNER JOIN orders o ON oi.order_id = o.id
      WHERE DATE(o.created_at) = CURRENT_DATE
        AND EXTRACT(HOUR FROM o.created_at) < 18
        AND o.status NOT IN ('cancelled', 'refunded')
      GROUP BY p.id, p.name, p.unit, p.image_url
      HAVING COALESCE(SUM(oi.quantity), 0) > 0
      ORDER BY total_quantity DESC
    `;

    const result = await pool.query(query);

    // Also get count of orders
    const ordersQuery = `
      SELECT COUNT(*) as total_orders
      FROM orders
      WHERE DATE(created_at) = CURRENT_DATE
        AND EXTRACT(HOUR FROM created_at) < 18
        AND status NOT IN ('cancelled', 'refunded')
    `;
    
    const ordersResult = await pool.query(ordersQuery);

    const isBeforeCutoff = now < cutoffTime;

    res.json({
      cutoffTime: '18:00',
      currentTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      isBeforeCutoff,
      tomorrowDate,
      products: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        unit: row.unit,
        image_url: row.image_url,
        total_quantity: parseFloat(row.total_quantity),
        order_count: parseInt(row.order_count),
        order_ids: row.order_ids
      })),
      totalProducts: result.rows.length,
      totalOrders: parseInt(ordersResult.rows[0]?.total_orders || 0)
    });
  } catch (error) {
    console.error('Error fetching tomorrow orders:', error);
    res.status(500).json({ error: 'Failed to fetch tomorrow orders' });
  }
}

module.exports = {
  getPreparationQuantities,
  getMultiDayPreparation,
  getTomorrowOrders
};
