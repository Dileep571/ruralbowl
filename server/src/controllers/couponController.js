const db = require('../config/database');

// Internal helper: Validate coupon (can be used by other controllers)
const validateCouponInternal = async (code, orderAmount, userId, client = null) => {
  const dbClient = client || db;

  // Get coupon details
  const couponResult = await dbClient.query(
    `SELECT * FROM coupons 
     WHERE UPPER(code) = UPPER($1) AND is_active = true`,
    [code]
  );

  if (couponResult.rows.length === 0) {
    throw new Error('Invalid coupon code');
  }

  const coupon = couponResult.rows[0];

  // Check expiry
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    throw new Error('Coupon has expired');
  }

  // Check usage limit
  if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
    throw new Error('Coupon usage limit reached');
  }

  // Check minimum order value
  if (coupon.min_order_value && orderAmount < parseFloat(coupon.min_order_value)) {
    throw new Error(`Minimum order value of ₹${coupon.min_order_value} required`);
  }

  // Check if user already used this coupon
  const usageResult = await dbClient.query(
    'SELECT COUNT(*) FROM coupon_usage WHERE coupon_id = $1 AND user_id = $2',
    [coupon.id, userId]
  );

  if (parseInt(usageResult.rows[0].count) > 0) {
    throw new Error('You have already used this coupon');
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.type === 'percentage') {
    discountAmount = (orderAmount * parseFloat(coupon.value)) / 100;
    // Apply max discount cap if exists
    if (coupon.max_discount && discountAmount > parseFloat(coupon.max_discount)) {
      discountAmount = parseFloat(coupon.max_discount);
    }
  } else {
    // Fixed amount discount
    discountAmount = parseFloat(coupon.value);
  }

  // Ensure discount doesn't exceed order amount
  discountAmount = Math.min(discountAmount, orderAmount);

  return {
    valid: true,
    coupon,
    discount: parseFloat(discountAmount.toFixed(2)),
  };
};

// API endpoint: Validate coupon
const validateCoupon = async (req, res) => {
  try {
    const userId = req.user.id;
    const { code, orderAmount } = req.body;

    if (!code || !orderAmount) {
      return res.status(400).json({ message: 'Coupon code and order amount are required' });
    }

    const result = await validateCouponInternal(code, orderAmount, userId);

    res.json({
      valid: true,
      coupon: {
        id: result.coupon.id,
        code: result.coupon.code,
        type: result.coupon.type,
        value: result.coupon.value,
        description: result.coupon.description,
      },
      discountAmount: result.discount,
      finalAmount: parseFloat((orderAmount - result.discount).toFixed(2)),
    });
  } catch (error) {
    if (error.message.includes('Invalid') || error.message.includes('expired') || 
        error.message.includes('limit') || error.message.includes('already used') ||
        error.message.includes('Minimum')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Validate coupon error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Internal helper: Apply coupon to order (can be used by other controllers)
const applyCouponInternal = async (couponId, userId, orderId, client) => {
  try {
    // Get discount amount
    const couponResult = await client.query(
      'SELECT * FROM coupons WHERE id = $1',
      [couponId]
    );
    
    if (couponResult.rows.length === 0) {
      throw new Error('Coupon not found');
    }

    // Record usage
    await client.query(
      `INSERT INTO coupon_usage (coupon_id, user_id, order_id)
       VALUES ($1, $2, $3)`,
      [couponId, userId, orderId]
    );

    // Increment used count
    await client.query(
      'UPDATE coupons SET used_count = used_count + 1 WHERE id = $1',
      [couponId]
    );

    return true;
  } catch (error) {
    console.error('Apply coupon error:', error);
    throw error;
  }
};

// Get all active coupons (for customers)
const getActiveCoupons = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, code, description, type, value, min_order_value, max_discount, expires_at
       FROM coupons
       WHERE is_active = true 
       AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
       AND (usage_limit IS NULL OR used_count < usage_limit)
       ORDER BY created_at DESC`
    );

    res.json({ coupons: result.rows });
  } catch (error) {
    console.error('Get active coupons error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Get all coupons
const getAllCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await db.query(
      `SELECT * FROM coupons 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await db.query('SELECT COUNT(*) FROM coupons');

    res.json({
      coupons: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
      },
    });
  } catch (error) {
    console.error('Get all coupons error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Create coupon
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      type,
      value,
      min_order_value,
      max_discount,
      usage_limit,
      expires_at,
    } = req.body;

    // Validate required fields
    if (!code || !type || !value) {
      return res.status(400).json({ message: 'Code, type, and value are required' });
    }

    // Validate type
    if (!['percentage', 'fixed'].includes(type)) {
      return res.status(400).json({ message: 'Type must be percentage or fixed' });
    }

    // Check if code already exists
    const existing = await db.query(
      'SELECT id FROM coupons WHERE UPPER(code) = UPPER($1)',
      [code]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    const result = await db.query(
      `INSERT INTO coupons (code, description, type, value, min_order_value, max_discount, usage_limit, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        code.toUpperCase(),
        description || null,
        type,
        value,
        min_order_value || null,
        max_discount || null,
        usage_limit || null,
        expires_at || null,
      ]
    );

    res.status(201).json({
      message: 'Coupon created successfully',
      coupon: result.rows[0],
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Update coupon
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      description,
      type,
      value,
      min_order_value,
      max_discount,
      usage_limit,
      expires_at,
      is_active,
    } = req.body;

    const result = await db.query(
      `UPDATE coupons
       SET description = COALESCE($1, description),
           type = COALESCE($2, type),
           value = COALESCE($3, value),
           min_order_value = COALESCE($4, min_order_value),
           max_discount = COALESCE($5, max_discount),
           usage_limit = COALESCE($6, usage_limit),
           expires_at = COALESCE($7, expires_at),
           is_active = COALESCE($8, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [description, type, value, min_order_value, max_discount, usage_limit, expires_at, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.json({
      message: 'Coupon updated successfully',
      coupon: result.rows[0],
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Delete coupon
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM coupons WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Get coupon usage statistics
const getCouponStats = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT 
        c.*,
        COUNT(cu.id) as total_uses,
        SUM(cu.discount_amount) as total_discount_given,
        COUNT(DISTINCT cu.user_id) as unique_users
       FROM coupons c
       LEFT JOIN coupon_usage cu ON c.id = cu.coupon_id
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get coupon stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  validateCoupon,
  validateCouponInternal,
  applyCouponInternal,
  getActiveCoupons,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponStats,
};
