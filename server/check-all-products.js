const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkProducts() {
  try {
    const result = await pool.query(`
      SELECT id, name, image_url, category_id
      FROM products 
      ORDER BY id
    `);
    
    console.log('All products and their image URLs:\n');
    result.rows.forEach(row => {
      const imageType = row.image_url?.startsWith('http') ? '[CLOUDINARY]' : '[LOCAL]';
      console.log(`${row.id}. ${row.name.padEnd(30)} ${imageType} ${row.image_url}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkProducts();
