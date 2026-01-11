const db = require('./src/config/database');

async function checkAllSchemas() {
  try {
    console.log('Checking all problematic table schemas...\n');
    
    // Check subscription_plans table
    const plansResult = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'subscription_plans' 
      ORDER BY ordinal_position
    `);
    console.log('📋 SUBSCRIPTION_PLANS table columns:');
    plansResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Check refresh_tokens table
    const tokensResult = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'refresh_tokens' 
      ORDER BY ordinal_position
    `);
    console.log('\n📋 REFRESH_TOKENS table columns:');
    tokensResult.rows.forEach(col => {
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
