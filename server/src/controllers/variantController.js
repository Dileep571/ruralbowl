const ProductVariant = require('../models/ProductVariant');
const db = require('../config/database');

// Get all variants for a product
const getProductVariants = async (req, res) => {
  try {
    const { productId } = req.params;
    const variants = await ProductVariant.getByProductId(productId);
    res.json({ variants });
  } catch (error) {
    console.error('Get variants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new variant
const createVariant = async (req, res) => {
  try {
    const { productId } = req.params;
    const variantData = {
      ...req.body,
      product_id: productId
    };

    const variant = await ProductVariant.create(variantData);

    // Update product to mark it has variants
    await db.query(
      'UPDATE products SET has_variants = true WHERE id = $1',
      [productId]
    );

    res.status(201).json({
      message: 'Variant created successfully',
      variant
    });
  } catch (error) {
    console.error('Create variant error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Variant with this value already exists for this product' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a variant
const updateVariant = async (req, res) => {
  try {
    const { variantId } = req.params;
    const variant = await ProductVariant.update(variantId, req.body);

    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    res.json({
      message: 'Variant updated successfully',
      variant
    });
  } catch (error) {
    console.error('Update variant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a variant
const deleteVariant = async (req, res) => {
  try {
    const { variantId } = req.params;

    // Get product_id before deletion
    const variant = await ProductVariant.getById(variantId);
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    await ProductVariant.delete(variantId);

    // Check if product still has variants
    const remainingVariants = await ProductVariant.getByProductId(variant.product_id);
    if (remainingVariants.length === 0) {
      await db.query(
        'UPDATE products SET has_variants = false WHERE id = $1',
        [variant.product_id]
      );
    }

    res.json({ message: 'Variant deleted successfully' });
  } catch (error) {
    console.error('Delete variant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Bulk create/update variants for a product
const bulkUpdateVariants = async (req, res) => {
  try {
    const { productId } = req.params;
    const { variants } = req.body; // Array of variant objects

    if (!Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({ message: 'Variants array is required' });
    }

    // Delete existing variants
    await ProductVariant.deleteByProductId(productId);

    // Create new variants
    const createdVariants = await Promise.all(
      variants.map((variant, index) => 
        ProductVariant.create({
          ...variant,
          product_id: productId,
          display_order: index
        })
      )
    );

    // Update product to mark it has variants
    await db.query(
      'UPDATE products SET has_variants = true WHERE id = $1',
      [productId]
    );

    res.json({
      message: 'Variants updated successfully',
      variants: createdVariants
    });
  } catch (error) {
    console.error('Bulk update variants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove all variants from a product
const removeAllVariants = async (req, res) => {
  try {
    const { productId } = req.params;

    await ProductVariant.deleteByProductId(productId);
    
    // Update product to mark it doesn't have variants
    await db.query(
      'UPDATE products SET has_variants = false WHERE id = $1',
      [productId]
    );

    res.json({ message: 'All variants removed successfully' });
  } catch (error) {
    console.error('Remove variants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProductVariants,
  createVariant,
  updateVariant,
  deleteVariant,
  bulkUpdateVariants,
  removeAllVariants
};
