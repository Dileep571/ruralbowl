const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authMiddleware } = require('../middleware/auth');

// Public routes - Browse subscription plans
router.get('/plans', subscriptionController.getSubscriptionPlans);

// Protected routes - Require authentication
router.use(authMiddleware);

// Purchase subscription plan
router.post('/purchase', subscriptionController.purchasePlan);

// Get user's subscriptions
router.get('/', subscriptionController.getMySubscriptions);

// Get subscription calendar
router.get('/:id/calendar', subscriptionController.getSubscriptionCalendar);

// Skip delivery
router.patch('/deliveries/:id/skip', subscriptionController.skipDelivery);

// Reschedule delivery
router.patch('/deliveries/:id/reschedule', subscriptionController.rescheduleDelivery);

// Pause subscription
router.patch('/:id/pause', subscriptionController.pausePlan);

// Resume subscription
router.patch('/:id/resume', subscriptionController.resumePlan);

// Cancel subscription (convert to wallet)
router.delete('/:id/cancel', subscriptionController.cancelPlan);

module.exports = router;
