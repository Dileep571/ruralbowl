const express = require('express');
const router = express.Router();
const {
  getDeliveryCalendar,
  addDeliverySchedule,
  updateDeliveryStatus,
  getSubscriptionPlans,
  getUserSubscription,
  subscribeToPlan,
} = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/auth');

// All dashboard routes require authentication
router.use(authMiddleware);

// Delivery Calendar Routes
// @route   GET /api/dashboard/calendar
// @desc    Get delivery calendar
// @access  Private
router.get('/calendar', getDeliveryCalendar);

// @route   POST /api/dashboard/calendar
// @desc    Add delivery schedule
// @access  Private
router.post('/calendar', addDeliverySchedule);

// @route   PUT /api/dashboard/calendar/:id
// @desc    Update delivery status
// @access  Private
router.put('/calendar/:id', updateDeliveryStatus);

// Subscription Routes
// @route   GET /api/dashboard/subscription/plans
// @desc    Get all subscription plans
// @access  Private
router.get('/subscription/plans', getSubscriptionPlans);

// @route   GET /api/dashboard/subscription
// @desc    Get user subscription
// @access  Private
router.get('/subscription', getUserSubscription);

// @route   POST /api/dashboard/subscription
// @desc    Subscribe to a plan
// @access  Private
router.post('/subscription', subscribeToPlan);

module.exports = router;
