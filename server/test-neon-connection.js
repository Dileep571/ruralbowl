const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

const testConnection = async () => {
  console.log('🧪 Testing Neon connection with .env settings...\n');
  console.log(`📍 Host: ${process.env.DB_HOST}`);
  console.log(`📦 Database: ${process.env.DB_NAME}`);
  console.log(`👤 User: ${process.env.DB_USER}\n`);

  try {
    const client = await pool.connect();
    console.log('✅ Connected to Neon database!\n');
    
    // Test queries
    console.log('📊 Running test queries...\n');
    
    const users = await client.query('SELECT COUNT(*) FROM users');
    console.log(`  👥 Users: ${users.rows[0].count}`);
    
    const products = await client.query('SELECT COUNT(*) FROM products');
    console.log(`  📦 Products: ${products.rows[0].count}`);
    
    const categories = await client.query('SELECT COUNT(*) FROM categories');
    console.log(`  📂 Categories: ${categories.rows[0].count}`);
    
    const orders = await client.query('SELECT COUNT(*) FROM orders');
    console.log(`  🛒 Orders: ${orders.rows[0].count}`);
    
    console.log('\n🎉 All tests passed! Your app is now connected to Neon!\n');
    
    client.release();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await pool.end();
  }
};

testConnection();
