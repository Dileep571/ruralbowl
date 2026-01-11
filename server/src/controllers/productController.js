const db = require('../config/database');
const ProductVariant = require('../models/ProductVariant');

// Get All Products
const getProducts = async (req, res) => {
  try {
    const { category, search, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_active = true
    `;
    const params = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND c.slug = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      query += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Fetch variants for each product
    const productsWithVariants = await Promise.all(
      result.rows.map(async (product) => {
        if (product.has_variants) {
          const variants = await ProductVariant.getByProductId(product.id);
          const priceRange = await ProductVariant.getPriceRange(product.id);
          return { ...product, variants, price_range: priceRange };
        }
        return product;
      })
    );

    res.json({
      products: productsWithVariants,
      count: productsWithVariants.length,
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Single Product by Slug
const getProductById = async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await db.query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.slug = $1`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = result.rows[0];

    // Fetch variants if product has variants
    if (product.has_variants) {
      const variants = await ProductVariant.getByProductId(product.id);
      product.variants = variants;
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create Product (Admin only)
const createProduct = async (req, res) => {
  try {
    const { name, slug, description, price, unit, unit_value, category_id, image_url, stock_quantity } = req.body;

    const result = await db.query(
      `INSERT INTO products (name, slug, description, price, unit, unit_value, category_id, image_url, stock_quantity) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [name, slug, description, price, unit, unit_value || 1, category_id, image_url, stock_quantity || 0]
    );

    res.status(201).json({
      message: 'Product created successfully',
      product: result.rows[0],
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Product (Admin only)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, price, unit, unit_value, category_id, image_url, stock_quantity, is_active } = req.body;

    const result = await db.query(
      `UPDATE products 
       SET name = $1, slug = $2, description = $3, price = $4, unit = $5, 
           unit_value = $6, category_id = $7, image_url = $8, stock_quantity = $9, is_active = $10, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $11 
       RETURNING *`,
      [name, slug, description, price, unit, unit_value || 1, category_id, image_url, stock_quantity, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      message: 'Product updated successfully',
      product: result.rows[0],
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete Product (Admin only)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get All Categories
const getCategories = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM categories ORDER BY name');
    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
};
