const db = require('./database');

async function updateCartForVariants() {
  try {
    console.log('Updating cart table for variants support...');

    // Add variant_id column to cart table
    await db.query(`
      ALTER TABLE cart 
      ADD COLUMN IF NOT EXISTS variant_id INTEGER REFERENCES product_variants(id) ON DELETE CASCADE
    `);
    console.log('✓ variant_id column added to cart table');

    // Update unique constraint to include variant_id
    await db.query(`
      ALTER TABLE cart 
      DROP CONSTRAINT IF EXISTS cart_user_product_unique
    `);
    
    await db.query(`
      ALTER TABLE cart 
      ADD CONSTRAINT cart_user_product_variant_unique 
      UNIQUE (user_id, product_id, variant_id)
    `);
    console.log('✓ Unique constraint updated for cart');

    // Do the same for order_items table
    await db.query(`
      ALTER TABLE order_items 
      ADD COLUMN IF NOT EXISTS variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL
    `);
    console.log('✓ variant_id column added to order_items table');

    await db.query(`
      ALTER TABLE order_items 
      ADD COLUMN IF NOT EXISTS variant_name VARCHAR(200)
    `);
    console.log('✓ variant_name column added to order_items table');

    console.log('\n✅ Cart and order tables updated for variants support!');
    
  } catch (error) {
    console.error('Error updating cart schema:', error);
    throw error;
  } finally {
    await db.pool.end();
  }
}

updateCartForVariants();
