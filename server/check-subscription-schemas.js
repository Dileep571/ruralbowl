const db = require('./src/config/database');

async function checkSubscriptionSchemas() {
  try {
    console.log('Checking subscription table schemas...\n');
    
    // Check user_plans table
    const userPlansResult = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_plans' 
      ORDER BY ordinal_position
    `);
    console.log('📋 USER_PLANS table columns:');
    userPlansResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Check subscription_plans table
    const plansResult = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'subscription_plans' 
      ORDER BY ordinal_position
    `);
    console.log('\n📋 SUBSCRIPTION_PLANS table columns:');
    plansResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    console.log('\n✅ Schema check complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSubscriptionSchemas();
