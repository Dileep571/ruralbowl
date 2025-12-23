require('dotenv').config();
const { pool } = require('./config');

const reset = async () => {
  console.log('🗑️  Resetting database...\n');

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Drop all tables in correct order (respecting foreign keys)
    const tables = [
      'delivery_calendar',
      'order_items',
      'orders',
      'cart_items',
      'user_subscriptions',
      'products',
      'categories',
      'subscription_plans',
      'admin_users',
      'users'
    ];

    for (const table of tables) {
      await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`  Dropped table: ${table}`);
    }

    await client.query('COMMIT');
    console.log('\n✅ Database reset complete!');
    console.log('💡 Run "npm run db:migrate" followed by "npm run db:seed" to recreate tables and data');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Reset failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

reset().catch(console.error);
