const { Pool } = require('pg');

const localPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ruralbowldb',
  user: 'postgres',
  password: 'Ruralbowl@2025',
});

const checkLocalData = async () => {
  const client = await localPool.connect();
  
  try {
    console.log('🔍 Checking local database structure...\n');
    
    // Check product_variants
    console.log('📦 Product Variants:');
    const variants = await client.query('SELECT * FROM product_variants LIMIT 2');
    console.log(JSON.stringify(variants.rows, null, 2));
    
    console.log('\n📅 Subscription Plans:');
    const plans = await client.query('SELECT * FROM subscription_plans LIMIT 1');
    console.log(JSON.stringify(plans.rows, null, 2));
    
    console.log('\n🛒 Orders:');
    const orders = await client.query('SELECT * FROM orders LIMIT 1');
    console.log(JSON.stringify(orders.rows, null, 2));
    
    console.log('\n📝 Order Items:');
    const items = await client.query('SELECT * FROM order_items LIMIT 1');
    console.log(JSON.stringify(items.rows, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await localPool.end();
  }
};

checkLocalData();
