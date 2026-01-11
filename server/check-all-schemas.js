const db = require('./src/config/database');

async function checkAllSchemas() {
  try {
    console.log('Checking database schemas...\n');
    
    // Check orders table
    const ordersResult = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position
    `);
    console.log('📋 ORDERS table columns:');
    ordersResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Check coupon_usage table
    const couponUsageResult = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'coupon_usage' 
      ORDER BY ordinal_position
    `);
    console.log('\n📋 COUPON_USAGE table columns:');
    couponUsageResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    console.log('\n✅ Schema check complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAllSchemas();
