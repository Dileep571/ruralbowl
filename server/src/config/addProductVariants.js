const db = require('./database');

async function addProductVariants() {
  try {
    console.log('Creating product_variants table...');

    // Create product_variants table
    await db.query(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        variant_name VARCHAR(100) NOT NULL,
        variant_value VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        original_price DECIMAL(10, 2),
        sku VARCHAR(100) UNIQUE,
        stock_quantity INTEGER DEFAULT 0,
        is_available BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, variant_value)
      )
    `);
    console.log('✓ product_variants table created');

    // Add has_variants column to products table
    await db.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false
    `);
    console.log('✓ has_variants column added to products table');

    // Create index for faster queries
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_product_variants_product_id 
      ON product_variants(product_id)
    `);
    console.log('✓ Index created on product_variants');

    console.log('\n✅ Product variants schema updated successfully!');
    
  } catch (error) {
    console.error('Error creating product variants schema:', error);
    throw error;
  } finally {
    await db.pool.end();
  }
}

addProductVariants();
