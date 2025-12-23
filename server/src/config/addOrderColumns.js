const db = require('./database');

async function addOrderColumns() {
  try {
    console.log('Adding missing columns to orders table...');
    
    // Add subtotal column
    await db.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0
    `);
    console.log('✓ Added subtotal column');
    
    // Add discount_amount column
    await db.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0
    `);
    console.log('✓ Added discount_amount column');
    
    // Add coupon_id column (only if coupons table exists)
    try {
      await db.query(`
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS coupon_id INTEGER
      `);
      console.log('✓ Added coupon_id column');
    } catch (e) {
      console.log('⚠ Skipped coupon_id (coupons table may not exist)');
    }
    
    console.log('\n✅ All columns added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding columns:', error.message);
    process.exit(1);
  }
}

addOrderColumns();
