const db = require('../config/database');

// Get user's wishlist
const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT 
        w.id as wishlist_id,
        w.created_at as added_at,
        p.*,
        c.name as category_name
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [userId]
    );

    res.json({ wishlist: result.rows });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add item to wishlist
const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Check if product exists
    const productCheck = await db.query(
      'SELECT id FROM products WHERE id = $1',
      [product_id]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if already in wishlist
    const existing = await db.query(
      'SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2',
      [userId, product_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    // Add to wishlist
    const result = await db.query(
      'INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2) RETURNING *',
      [userId, product_id]
    );

    res.status(201).json({
      message: 'Added to wishlist',
      wishlist_item: result.rows[0],
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove item from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM wishlist WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Wishlist item not found' });
    }

    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove by product ID
const removeProductFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const result = await db.query(
      'DELETE FROM wishlist WHERE product_id = $1 AND user_id = $2 RETURNING *',
      [productId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not in wishlist' });
    }

    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Remove product from wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if product is in wishlist
const checkWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const result = await db.query(
      'SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    res.json({ inWishlist: result.rows.length > 0 });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Move wishlist item to cart
const moveToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity = 1 } = req.body;

    // Get wishlist item
    const wishlistResult = await db.query(
      'SELECT product_id FROM wishlist WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (wishlistResult.rows.length === 0) {
      return res.status(404).json({ message: 'Wishlist item not found' });
    }

    const productId = wishlistResult.rows[0].product_id;

    // Check if already in cart
    const cartCheck = await db.query(
      'SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    if (cartCheck.rows.length > 0) {
      // Update quantity
      await db.query(
        'UPDATE cart SET quantity = quantity + $1 WHERE id = $2',
        [quantity, cartCheck.rows[0].id]
      );
    } else {
      // Add to cart
      await db.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)',
        [userId, productId, quantity]
      );
    }

    // Remove from wishlist
    await db.query(
      'DELETE FROM wishlist WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ message: 'Moved to cart successfully' });
  } catch (error) {
    console.error('Move to cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Clear entire wishlist
const clearWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    await db.query('DELETE FROM wishlist WHERE user_id = $1', [userId]);

    res.json({ message: 'Wishlist cleared' });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get wishlist count
const getWishlistCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      'SELECT COUNT(*) FROM wishlist WHERE user_id = $1',
      [userId]
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Get wishlist count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  removeProductFromWishlist,
  checkWishlist,
  moveToCart,
  clearWishlist,
  getWishlistCount,
};
