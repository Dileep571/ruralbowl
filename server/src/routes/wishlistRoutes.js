const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { authMiddleware } = require('../middleware/auth');

// All wishlist routes require authentication
router.get('/wishlist', authMiddleware, wishlistController.getWishlist);
router.get('/wishlist/count', authMiddleware, wishlistController.getWishlistCount);
router.get('/wishlist/check/:productId', authMiddleware, wishlistController.checkWishlist);
router.post('/wishlist', authMiddleware, wishlistController.addToWishlist);
router.delete('/wishlist/:id', authMiddleware, wishlistController.removeFromWishlist);
router.delete('/wishlist/product/:productId', authMiddleware, wishlistController.removeProductFromWishlist);
router.post('/wishlist/:id/move-to-cart', authMiddleware, wishlistController.moveToCart);
router.delete('/wishlist', authMiddleware, wishlistController.clearWishlist);

module.exports = router;
