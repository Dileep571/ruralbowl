const db = require('../config/database');

// Get User Cart
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT c.id, c.quantity, c.created_at, c.updated_at,
       json_build_object(
         'id', p.id,
         'name', p.name,
         'price', p.price,
         'unit', p.unit,
         'image_url', p.image_url,
         'stock_quantity', p.stock_quantity
       ) as product
       FROM cart c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.user_id = $1`,
      [userId]
    );

    // Return flat array with product nested inside
    res.json(result.rows);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add to Cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity } = req.body;

    // Check if product exists and is available
    const productCheck = await db.query(
      'SELECT * FROM products WHERE id = $1 AND is_available = true',
      [product_id]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found or not available' });
    }

    const product = productCheck.rows[0];

    // Check if item already in cart
    const existingItem = await db.query(
      'SELECT * FROM cart WHERE user_id = $1 AND product_id = $2',
      [userId, product_id]
    );

    // Calculate total quantity after adding
    const currentCartQty = existingItem.rows.length > 0 ? existingItem.rows[0].quantity : 0;
    const totalRequestedQty = currentCartQty + quantity;

    // Check stock availability
    if (totalRequestedQty > product.stock_quantity) {
      return res.status(400).json({ 
        message: `Only ${product.stock_quantity} units available in stock. You already have ${currentCartQty} in cart.`,
        availableStock: product.stock_quantity,
        currentCartQuantity: currentCartQty
      });
    }

    let result;
    if (existingItem.rows.length > 0) {
      // Update quantity
      result = await db.query(
        'UPDATE cart SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND product_id = $3 RETURNING *',
        [quantity, userId, product_id]
      );
    } else {
      // Insert new item
      result = await db.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
        [userId, product_id, quantity]
      );
    }

    res.json({
      message: 'Item added to cart',
      cartItem: result.rows[0],
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Cart Item
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    // Get current cart item with product stock info
    const cartItem = await db.query(
      `SELECT c.*, p.stock_quantity 
       FROM cart c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.id = $1 AND c.user_id = $2`,
      [id, userId]
    );

    if (cartItem.rows.length === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    // Check stock availability
    if (quantity > cartItem.rows[0].stock_quantity) {
      return res.status(400).json({ 
        message: `Only ${cartItem.rows[0].stock_quantity} units available in stock`,
        availableStock: cartItem.rows[0].stock_quantity
      });
    }

    const result = await db.query(
      'UPDATE cart SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
      [quantity, id, userId]
    );

    res.json({
      message: 'Cart updated',
      cartItem: result.rows[0],
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove from Cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM cart WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Clear Cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    await db.query('DELETE FROM cart WHERE user_id = $1', [userId]);
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Merge Guest Cart (when user logs in)
const mergeGuestCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body; // Array of { product_id, quantity }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.json({ message: 'No items to merge', cart: [] });
    }

    const merged = [];
    for (const item of items) {
      const { product_id, quantity } = item;

      // Check if product exists and is available
      const productCheck = await db.query(
        'SELECT * FROM products WHERE id = $1 AND is_available = true',
        [product_id]
      );

      if (productCheck.rows.length === 0) {
        continue; // Skip unavailable products
      }

      const product = productCheck.rows[0];

      // Check if item already in cart
      const existingItem = await db.query(
        'SELECT * FROM cart WHERE user_id = $1 AND product_id = $2',
        [userId, product_id]
      );

      let result;
      if (existingItem.rows.length > 0) {
        // Update quantity (add guest quantity to existing)
        const newQty = Math.min(
          existingItem.rows[0].quantity + quantity,
          product.stock_quantity
        );
        result = await db.query(
          'UPDATE cart SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND product_id = $3 RETURNING *',
          [newQty, userId, product_id]
        );
      } else {
        // Insert new item
        const safeQty = Math.min(quantity, product.stock_quantity);
        result = await db.query(
          'INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
          [userId, product_id, safeQty]
        );
      }
      merged.push(result.rows[0]);
    }

    // Return updated cart
    const cartResult = await db.query(
      `SELECT c.id, c.quantity, c.created_at, c.updated_at,
       json_build_object(
         'id', p.id,
         'name', p.name,
         'price', p.price,
         'unit', p.unit,
         'image_url', p.image_url,
         'stock_quantity', p.stock_quantity
       ) as product
       FROM cart c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.user_id = $1`,
      [userId]
    );

    res.json({ 
      message: `Merged ${merged.length} item(s) to cart`,
      cart: cartResult.rows
    });
  } catch (error) {
    console.error('Merge cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeGuestCart,
};
