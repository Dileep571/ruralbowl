const db = require('../config/database');

class ProductVariant {
  // Get all variants for a product
  static async getByProductId(productId) {
    const result = await db.query(
      `SELECT * FROM product_variants 
       WHERE product_id = $1 
       ORDER BY display_order ASC, price ASC`,
      [productId]
    );
    return result.rows;
  }

  // Get single variant by id
  static async getById(id) {
    const result = await db.query(
      'SELECT * FROM product_variants WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  // Create a new variant
  static async create(variantData) {
    const {
      product_id,
      variant_name,
      variant_value,
      price,
      original_price,
      sku,
      stock_quantity,
      is_available,
      display_order
    } = variantData;

    const result = await db.query(
      `INSERT INTO product_variants 
       (product_id, variant_name, variant_value, price, original_price, sku, stock_quantity, is_available, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [product_id, variant_name, variant_value, price, original_price || null, sku || null, stock_quantity || 0, is_available !== false, display_order || 0]
    );
    return result.rows[0];
  }

  // Update a variant
  static async update(id, variantData) {
    const {
      variant_name,
      variant_value,
      price,
      original_price,
      sku,
      stock_quantity,
      is_available,
      display_order
    } = variantData;

    const result = await db.query(
      `UPDATE product_variants 
       SET variant_name = $1, variant_value = $2, price = $3, original_price = $4,
           sku = $5, stock_quantity = $6, is_available = $7, display_order = $8,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [variant_name, variant_value, price, original_price || null, sku || null, stock_quantity, is_available, display_order || 0, id]
    );
    return result.rows[0];
  }

  // Delete a variant
  static async delete(id) {
    await db.query('DELETE FROM product_variants WHERE id = $1', [id]);
  }

  // Delete all variants for a product
  static async deleteByProductId(productId) {
    await db.query('DELETE FROM product_variants WHERE product_id = $1', [productId]);
  }

  // Get price range for a product
  static async getPriceRange(productId) {
    const result = await db.query(
      `SELECT MIN(price) as min_price, MAX(price) as max_price 
       FROM product_variants 
       WHERE product_id = $1 AND is_available = true`,
      [productId]
    );
    return result.rows[0];
  }

  // Update stock quantity
  static async updateStock(id, quantity) {
    const result = await db.query(
      `UPDATE product_variants 
       SET stock_quantity = stock_quantity + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [quantity, id]
    );
    return result.rows[0];
  }

  // Check if variant has enough stock
  static async hasStock(id, requestedQuantity) {
    const result = await db.query(
      'SELECT stock_quantity FROM product_variants WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return false;
    return result.rows[0].stock_quantity >= requestedQuantity;
  }
}

module.exports = ProductVariant;
