const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeGuestCart,
} = require('../controllers/cartController');
const { authMiddleware } = require('../middleware/auth');

// @route   POST /api/cart/merge
// @desc    Merge guest cart with user cart (on login)
// @access  Private
router.post('/merge', authMiddleware, mergeGuestCart);

// All other cart routes require authentication
router.use(authMiddleware);

// @route   GET /api/cart
// @desc    Get user cart
// @access  Private
router.get('/', getCart);

// @route   POST /api/cart
// @desc    Add item to cart
// @access  Private
router.post('/', addToCart);

// @route   PUT /api/cart/:id
// @desc    Update cart item quantity
// @access  Private
router.put('/:id', updateCartItem);

// @route   DELETE /api/cart/:id
// @desc    Remove item from cart
// @access  Private
router.delete('/:id', removeFromCart);

// @route   DELETE /api/cart
// @desc    Clear cart
// @access  Private
router.delete('/', clearCart);

module.exports = router;
