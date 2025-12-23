const express = require('express');
const { query } = require('../db/config');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all products
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, search, featured, limit, offset } = req.query;
    
    let sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
    `;
    const params = [];
    let paramIndex = 1;

    if (category) {
      sql += ` AND (c.slug = $${paramIndex} OR c.id::text = $${paramIndex})`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      sql += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (featured === 'true') {
      sql += ` AND p.is_featured = true`;
    }

    sql += ` ORDER BY p.is_featured DESC, p.created_at DESC`;

    if (limit) {
      sql += ` LIMIT $${paramIndex}`;
      params.push(parseInt(limit));
      paramIndex++;
    }

    if (offset) {
      sql += ` OFFSET $${paramIndex}`;
      params.push(parseInt(offset));
      paramIndex++;
    }

    const result = await query(sql, params);

    // Get total count for pagination
    let countSql = `SELECT COUNT(*) FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = true`;
    const countParams = [];
    let countIndex = 1;

    if (category) {
      countSql += ` AND (c.slug = $${countIndex} OR c.id::text = $${countIndex})`;
      countParams.push(category);
      countIndex++;
    }

    if (search) {
      countSql += ` AND (p.name ILIKE $${countIndex} OR p.description ILIKE $${countIndex})`;
      countParams.push(`%${search}%`);
      countIndex++;
    }

    if (featured === 'true') {
      countSql += ` AND p.is_featured = true`;
    }

    const countResult = await query(countSql, countParams);

    res.json({
      products: result.rows,
      count: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// Get product categories
router.get('/categories', async (req, res) => {
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

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Support both numeric ID and slug
    const isNumeric = /^\d+$/.test(id);
    const sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${isNumeric ? 'p.id = $1' : 'p.slug = $1'} AND p.is_active = true
    `;
    
    const result = await query(sql, [isNumeric ? parseInt(id) : id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get related products from same category
    const product = result.rows[0];
    const relatedResult = await query(
      `SELECT id, name, slug, price, original_price, image_url, unit
       FROM products 
       WHERE category_id = $1 AND id != $2 AND is_active = true
       LIMIT 4`,
      [product.category_id, product.id]
    );

    res.json({
      product: product,
      relatedProducts: relatedResult.rows
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

module.exports = router;
