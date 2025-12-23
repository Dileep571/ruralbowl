const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { authMiddleware } = require('../middleware/auth');

// Customer routes
router.get('/coupons/active', authMiddleware, couponController.getActiveCoupons);
router.post('/coupons/validate', authMiddleware, couponController.validateCoupon);

module.exports = router;
