const db = require('./src/config/database');

async function checkOrderItemsSchema() {
  try {
    console.log('Checking order_items table schema...\n');
    
    const result = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'order_items' 
      ORDER BY ordinal_position
    `);
    
    console.log('ORDER_ITEMS table columns:');
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n✅ Schema check complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkOrderItemsSchema();
