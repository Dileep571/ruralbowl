const fs = require('fs');
const path = require('path');
const db = require('./database');

async function runMigrations() {
  try {
    console.log('🔄 Starting database migrations...\n');

    const migrationPath = path.join(__dirname, 'migrations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute entire SQL file at once
    await db.query(migrationSQL);
    
    console.log('✅ Migrations executed successfully!\n');

    // Verify new tables
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'reviews', 'coupons', 'coupon_usage', 'wishlist', 'activity_logs', 
        'order_tracking', 'subscription_plans', 'user_plans', 'plan_deliveries', 
        'plan_modifications', 'wallets', 'wallet_transactions'
      )
      ORDER BY table_name
    `);
    
    console.log('📊 Tables verified:');
    result.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });
    
    console.log('\n🎉 Migration completed successfully!');
    
    await db.pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    await db.pool.end();
    process.exit(1);
  }
}

runMigrations();
