const db = require('../config/database');
const ProductVariant = require('../models/ProductVariant');

// Get User Cart
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT c.id, c.quantity, c.variant_id, c.created_at, c.updated_at,
       json_build_object(
         'id', p.id,
         'name', p.name,
         'price', p.price,
         'unit', p.unit,
         'image_url', p.image_url,
         'stock_quantity', p.stock_quantity,
         'has_variants', p.has_variants
       ) as product
       FROM cart c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.user_id = $1`,
      [userId]
    );

    // Add variant details if applicable
    const cartItems = await Promise.all(
      result.rows.map(async (item) => {
        if (item.variant_id) {
          const variant = await ProductVariant.getById(item.variant_id);
          item.variant = variant;
          // Use variant price instead of product price
          item.product.price = variant.price;
        }
        return item;
      })
    );

    res.json(cartItems);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add to Cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity, variant_id } = req.body;

    // Check if product exists and is available
    const productCheck = await db.query(
      'SELECT * FROM products WHERE id = $1 AND is_available = true',
      [product_id]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found or not available' });
    }

    const product = productCheck.rows[0];
    let stockQuantity = product.stock_quantity;
    let itemPrice = product.price;

    // If product has variants, variant_id is required
    if (product.has_variants && !variant_id) {
      return res.status(400).json({ message: 'Please select a variant' });
    }

    // If variant is selected, check variant availability and use variant stock
    if (variant_id) {
      const variant = await ProductVariant.getById(variant_id);
      if (!variant || !variant.is_available) {
        return res.status(404).json({ message: 'Variant not found or not available' });
      }
      stockQuantity = variant.stock_quantity;
      itemPrice = variant.price;
    }

    // Check if item already in cart (with same variant if applicable)
    const existingItem = await db.query(
      `SELECT * FROM cart 
       WHERE user_id = $1 AND product_id = $2 AND ($3::INTEGER IS NULL OR variant_id = $3)`,
      [userId, product_id, variant_id || null]
    );

    // Calculate total quantity after adding
    const currentCartQty = existingItem.rows.length > 0 ? existingItem.rows[0].quantity : 0;
    const totalRequestedQty = currentCartQty + quantity;

    // Check stock availability
    if (totalRequestedQty > stockQuantity) {
      return res.status(400).json({ 
        message: `Only ${stockQuantity} units available in stock. You already have ${currentCartQty} in cart.`,
        availableStock: stockQuantity,
        currentCartQuantity: currentCartQty
      });
    }

    let result;
    if (existingItem.rows.length > 0) {
      // Update quantity
      result = await db.query(
        'UPDATE cart SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND product_id = $3 AND ($4::INTEGER IS NULL OR variant_id = $4) RETURNING *',
        [quantity, userId, product_id, variant_id || null]
      );
    } else {
      // Insert new item
      result = await db.query(
        'INSERT INTO cart (user_id, product_id, quantity, variant_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, product_id, quantity, variant_id || null]
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
