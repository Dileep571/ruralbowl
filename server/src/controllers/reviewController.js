const db = require('../config/database');

// Get all reviews for a product
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sortBy = 'recent' } = req.query;
    const offset = (page - 1) * limit;

    let orderClause = 'r.created_at DESC';
    if (sortBy === 'helpful') orderClause = 'r.helpful_count DESC, r.created_at DESC';
    if (sortBy === 'rating_high') orderClause = 'r.rating DESC, r.created_at DESC';
    if (sortBy === 'rating_low') orderClause = 'r.rating ASC, r.created_at DESC';

    const result = await db.query(
      `SELECT r.*, u.name as user_name, u.email as user_email
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1 AND r.approved = true
       ORDER BY ${orderClause}
       LIMIT $2 OFFSET $3`,
      [productId, limit, offset]
    );

    const countResult = await db.query(
      'SELECT COUNT(*) FROM reviews WHERE product_id = $1 AND approved = true',
      [productId]
    );

    const total = parseInt(countResult.rows[0].count);

    res.json({
      reviews: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get review statistics for a product
const getReviewStats = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await db.query(
      `SELECT 
        COUNT(*) as total_reviews,
        COALESCE(AVG(rating), 0) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
       FROM reviews
       WHERE product_id = $1 AND approved = true`,
      [productId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a review
const createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, rating, title, comment, images } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if user already reviewed this product
    const existing = await db.query(
      'SELECT id FROM reviews WHERE user_id = $1 AND product_id = $2',
      [userId, product_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Check if user purchased this product
    const purchased = await db.query(
      `SELECT o.id 
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status = 'delivered'
       LIMIT 1`,
      [userId, product_id]
    );

    const verified_purchase = purchased.rows.length > 0;

    const result = await db.query(
      `INSERT INTO reviews (product_id, user_id, rating, title, comment, images, verified_purchase)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [product_id, userId, rating, title || null, comment || null, JSON.stringify(images || []), verified_purchase]
    );

    res.status(201).json({
      message: 'Review created successfully',
      review: result.rows[0],
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a review
const updateReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { rating, title, comment, images } = req.body;

    // Check if review belongs to user
    const review = await db.query(
      'SELECT * FROM reviews WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (review.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }

    const result = await db.query(
      `UPDATE reviews 
       SET rating = $1, title = $2, comment = $3, images = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [rating, title, comment, JSON.stringify(images || []), id, userId]
    );

    res.json({
      message: 'Review updated successfully',
      review: result.rows[0],
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a review
const deleteReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark review as helpful
const markReviewHelpful = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = $1',
      [id]
    );

    res.json({ message: 'Thank you for your feedback!' });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Get all reviews (pending approval)
const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    if (status === 'pending') whereClause = 'WHERE r.approved = false';
    if (status === 'approved') whereClause = 'WHERE r.approved = true';

    const result = await db.query(
      `SELECT r.*, u.name as user_name, p.name as product_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN products p ON r.product_id = p.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await db.query(
      `SELECT COUNT(*) FROM reviews r ${whereClause}`
    );

    res.json({
      reviews: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
      },
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Approve/reject review
const updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    const result = await db.query(
      'UPDATE reviews SET approved = $1 WHERE id = $2 RETURNING *',
      [approved, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({
      message: `Review ${approved ? 'approved' : 'rejected'} successfully`,
      review: result.rows[0],
    });
  } catch (error) {
    console.error('Update review status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Delete review
const adminDeleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM reviews WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Admin delete review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProductReviews,
  getReviewStats,
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  getAllReviews,
  updateReviewStatus,
  adminDeleteReview,
};
