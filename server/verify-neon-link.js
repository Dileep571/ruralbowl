const { Pool } = require('pg');
require('dotenv').config();

console.log('🔗 Verifying RuralBowl App → Neon Database Connection\n');
console.log('═══════════════════════════════════════════════════\n');

// Test Backend Server Configuration
console.log('📋 Backend Server Configuration:');
console.log(`   Host: ${process.env.DB_HOST}`);
console.log(`   Database: ${process.env.DB_NAME}`);
console.log(`   User: ${process.env.DB_USER}`);
console.log(`   Port: ${process.env.DB_PORT}\n`);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

const verifyConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to Neon database!\n');
    
    // Check data
    console.log('📊 Database Content:');
    
    const users = await client.query('SELECT COUNT(*) FROM users');
    console.log(`   👥 Users: ${users.rows[0].count}`);
    
    const categories = await client.query('SELECT COUNT(*) FROM categories');
    console.log(`   📂 Categories: ${categories.rows[0].count}`);
    
    const products = await client.query('SELECT COUNT(*) FROM products');
    console.log(`   📦 Products: ${products.rows[0].count}`);
    
    const cart = await client.query('SELECT COUNT(*) FROM cart');
    console.log(`   🛒 Cart Items: ${cart.rows[0].count}`);
    
    const orders = await client.query('SELECT COUNT(*) FROM orders');
    console.log(`   📝 Orders: ${orders.rows[0].count}`);
    
    const wallets = await client.query('SELECT COUNT(*) FROM wallets');
    console.log(`   💰 Wallets: ${wallets.rows[0].count}\n`);
    
    // Check sample data
    console.log('📝 Sample Data Check:');
    const sampleUser = await client.query('SELECT email, name FROM users LIMIT 1');
    if (sampleUser.rows.length > 0) {
      console.log(`   ✅ Sample User: ${sampleUser.rows[0].name} (${sampleUser.rows[0].email})`);
    }
    
    const sampleProduct = await client.query('SELECT name, price FROM products LIMIT 1');
    if (sampleProduct.rows.length > 0) {
      console.log(`   ✅ Sample Product: ${sampleProduct.rows[0].name} - ₹${sampleProduct.rows[0].price}`);
    }
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('🎉 Your RuralBowl app is successfully linked to Neon!');
    console.log('═══════════════════════════════════════════════════\n');
    
    console.log('🚀 Next Steps:');
    console.log('   1. Start your backend: cd server && npm start');
    console.log('   2. Start your frontend: cd web && npm run dev');
    console.log('   3. Your app will now use Neon cloud database!\n');
    
    client.release();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\n💡 Check your .env file settings');
  } finally {
    await pool.end();
  }
};

verifyConnection();
