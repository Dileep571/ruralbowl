const express = require('express');
const { query } = require('../db/config');

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, slug, description, image_url FROM categories WHERE is_active = true ORDER BY name'
    );
    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// Get single category with products
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const isNumeric = /^\d+$/.test(id);
    const catSql = `SELECT * FROM categories WHERE ${isNumeric ? 'id = $1' : 'slug = $1'} AND is_active = true`;
    const catResult = await query(catSql, [isNumeric ? parseInt(id) : id]);

    if (catResult.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const category = catResult.rows[0];

    // Get products in this category
    const productsResult = await query(
      `SELECT id, name, slug, description, price, original_price, unit, stock_quantity, image_url, is_featured
       FROM products 
       WHERE category_id = $1 AND is_active = true
       ORDER BY is_featured DESC, name`,
      [category.id]
    );

    res.json({
      category: category,
      products: productsResult.rows
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'Failed to fetch category' });
  }
});

module.exports = router;
