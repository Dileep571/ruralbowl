const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const reviewController = require('../controllers/reviewController');
const couponController = require('../controllers/couponController');
const analyticsController = require('../controllers/analyticsController');
const subscriptionController = require('../controllers/subscriptionController');
const preparationController = require('../controllers/preparationController');
const { upload } = require('../services/imageUploadService');
const adminAuth = require('../middleware/adminAuth');

// Public routes
router.post('/login', adminController.adminLogin);
router.post('/logout', adminController.adminLogout);

// Protected admin routes
router.use(adminAuth); // All routes below require admin authentication

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

// Users Management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserDetails);
router.put('/users/:id', adminController.updateUser);

// Orders Management
router.get('/orders', adminController.getAllOrders);
router.get('/orders/:id', adminController.getOrderById);
router.patch('/orders/:id/status', adminController.updateOrderStatus);
router.patch('/orders/:id/payment-status', adminController.updateOrderPaymentStatus);

// Products Management
router.get('/products', adminController.getAllProducts);
router.get('/products/:id', adminController.getProductById);
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);
router.patch('/products/:id/stock', adminController.updateStock);

// Categories Management
router.get('/categories', adminController.getAllCategories);
router.get('/categories/:id', adminController.getCategoryById);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Reviews Management
router.get('/reviews', reviewController.getAllReviews);
router.patch('/reviews/:id/status', reviewController.updateReviewStatus);
router.delete('/reviews/:id', reviewController.adminDeleteReview);

// Coupons Management
router.get('/coupons', couponController.getAllCoupons);
router.get('/coupons/:id/stats', couponController.getCouponStats);
router.post('/coupons', couponController.createCoupon);
router.put('/coupons/:id', couponController.updateCoupon);
router.delete('/coupons/:id', couponController.deleteCoupon);

// Analytics
router.get('/analytics/dashboard', analyticsController.getDashboardAnalytics);
router.get('/analytics/sales-chart', analyticsController.getSalesChart);
router.get('/analytics/categories', analyticsController.getCategoryPerformance);
router.get('/analytics/customers', analyticsController.getCustomerAnalytics);
router.get('/analytics/products', analyticsController.getProductPerformance);
router.get('/analytics/inventory', analyticsController.getInventoryStatus);
router.get('/analytics/coupons', analyticsController.getCouponAnalytics);

// Image Upload
const { 
  handleImageUpload, 
  handleMultipleImageUpload, 
  handleImageDelete 
} = require('../services/imageUploadService');

router.post('/upload/image', upload.single('image'), handleImageUpload);
router.post('/upload/images', upload.array('images', 10), handleMultipleImageUpload);
router.delete('/upload/image', handleImageDelete);

// Subscription Management
router.get('/subscriptions', subscriptionController.getAllSubscriptions);
router.get('/subscriptions/plans', subscriptionController.getAllSubscriptionPlans);
router.get('/subscriptions/analytics', subscriptionController.getSubscriptionAnalytics);
router.post('/subscriptions/plans', subscriptionController.createSubscriptionPlan);
router.put('/subscriptions/plans/:id', subscriptionController.updateSubscriptionPlan);
router.delete('/subscriptions/plans/:id', subscriptionController.deleteSubscriptionPlan);
router.post('/subscriptions/process-deliveries', subscriptionController.processDeliveries);

// Preparation Planning
router.get('/preparation/quantities', preparationController.getPreparationQuantities);
router.get('/preparation/multi-day', preparationController.getMultiDayPreparation);
router.get('/preparation/tomorrow', preparationController.getTomorrowOrders);

module.exports = router;
