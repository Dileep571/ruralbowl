const { Pool } = require('pg');
require('dotenv').config();

const isNeonDatabase = process.env.DB_HOST && process.env.DB_HOST.includes('neon.tech');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: isNeonDatabase ? { rejectUnauthorized: false } : false,
});

async function checkSchema() {
  try {
    // Check cart table
    const cartColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'cart'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n=== CART TABLE COLUMNS ===');
    cartColumns.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check products table
    const productColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n=== PRODUCTS TABLE COLUMNS ===');
    productColumns.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check orders table
    const orderColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'orders'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n=== ORDERS TABLE COLUMNS ===');
    orderColumns.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkSchema();
