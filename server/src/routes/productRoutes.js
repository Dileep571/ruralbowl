const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} = require('../controllers/productController');
const {
  getProductVariants,
  createVariant,
  updateVariant,
  deleteVariant,
  bulkUpdateVariants,
  removeAllVariants
} = require('../controllers/variantController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', getProducts);

// @route   GET /api/products/categories
// @desc    Get all categories
// @access  Public
router.get('/categories', getCategories);

// @route   GET /api/products/:slug
// @desc    Get single product by slug
// @access  Public
router.get('/:slug', getProductById);

// @route   POST /api/products
// @desc    Create product (Admin only)
// @access  Private/Admin
router.post('/', authMiddleware, adminMiddleware, createProduct);

// @route   PUT /api/products/:id
// @desc    Update product (Admin only)
// @access  Private/Admin
router.put('/:id', authMiddleware, adminMiddleware, updateProduct);

// @route   DELETE /api/products/:id
// @desc    Delete product (Admin only)
// @access  Private/Admin
router.delete('/:id', authMiddleware, adminMiddleware, deleteProduct);

// Variant Routes
// @route   GET /api/products/:productId/variants
// @desc    Get all variants for a product
// @access  Public
router.get('/:productId/variants', getProductVariants);

// @route   POST /api/products/:productId/variants
// @desc    Create a new variant (Admin only)
// @access  Private/Admin
router.post('/:productId/variants', authMiddleware, adminMiddleware, createVariant);

// @route   PUT /api/products/:productId/variants/bulk
// @desc    Bulk create/update variants (Admin only)
// @access  Private/Admin
router.put('/:productId/variants/bulk', authMiddleware, adminMiddleware, bulkUpdateVariants);

// @route   DELETE /api/products/:productId/variants
// @desc    Remove all variants (Admin only)
// @access  Private/Admin
router.delete('/:productId/variants', authMiddleware, adminMiddleware, removeAllVariants);

// @route   PUT /api/products/:productId/variants/:variantId
// @desc    Update a variant (Admin only)
// @access  Private/Admin
router.put('/:productId/variants/:variantId', authMiddleware, adminMiddleware, updateVariant);

// @route   DELETE /api/products/:productId/variants/:variantId
// @desc    Delete a variant (Admin only)
// @access  Private/Admin
router.delete('/:productId/variants/:variantId', authMiddleware, adminMiddleware, deleteVariant);

module.exports = router;
