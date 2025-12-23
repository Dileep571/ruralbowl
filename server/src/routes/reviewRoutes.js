const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authMiddleware } = require('../middleware/auth');

// Public routes
router.get('/products/:productId/reviews', reviewController.getProductReviews);
router.get('/products/:productId/reviews/stats', reviewController.getReviewStats);

// Protected customer routes
router.post('/reviews', authMiddleware, reviewController.createReview);
router.put('/reviews/:id', authMiddleware, reviewController.updateReview);
router.delete('/reviews/:id', authMiddleware, reviewController.deleteReview);
router.post('/reviews/:id/helpful', authMiddleware, reviewController.markReviewHelpful);

module.exports = router;
