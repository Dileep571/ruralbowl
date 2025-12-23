const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
} = require('../controllers/orderController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// All order routes require authentication
router.use(authMiddleware);

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', createOrder);

// @route   GET /api/orders
// @desc    Get user orders
// @access  Private
router.get('/', getOrders);

// @route   GET /api/orders/all
// @desc    Get all orders (Admin)
// @access  Private/Admin
router.get('/all', adminMiddleware, getAllOrders);

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', getOrderById);

// @route   PUT /api/orders/:id
// @desc    Update order status (Admin)
// @access  Private/Admin
router.put('/:id', adminMiddleware, updateOrderStatus);

module.exports = router;
