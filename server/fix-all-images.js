const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function fixAllImages() {
  try {
    // Available local images:
    // - /images/vegetables/tomatoes-1.jpg (exists)
    // - /images/rice/basmati-1.jpg (exists)
    // - /images/mangoes/alphonso-1.jpg (exists)
    // Keep Cloudinary images as-is (they're external URLs)
    
    // Fix vegetables products (except ones with Cloudinary)
    await pool.query(`
      UPDATE products 
      SET image_url = '/images/vegetables/tomatoes-1.jpg'
      WHERE category_id = (SELECT id FROM categories WHERE name = 'Vegetables')
      AND (image_url IS NULL OR image_url NOT LIKE 'http%')
    `);
    
    // Fix rice products (except ones with Cloudinary)
    await pool.query(`
      UPDATE products 
      SET image_url = '/images/rice/basmati-1.jpg'
      WHERE category_id = (SELECT id FROM categories WHERE name = 'Rice')
      AND (image_url IS NULL OR image_url NOT LIKE 'http%')
    `);
    
    // Fix mango products (except ones with Cloudinary)
    await pool.query(`
      UPDATE products 
      SET image_url = '/images/mangoes/alphonso-1.jpg'
      WHERE category_id = (SELECT id FROM categories WHERE name IN ('Mangoes', 'Fruits'))
      AND (image_url IS NULL OR image_url NOT LIKE 'http%')
    `);
    
    // Fix grains products - use wheat placeholder from vegetables
    await pool.query(`
      UPDATE products 
      SET image_url = '/images/rice/basmati-1.jpg'
      WHERE category_id = (SELECT id FROM categories WHERE name = 'Grains')
      AND (image_url IS NULL OR image_url NOT LIKE 'http%')
    `);
    
    console.log('✅ Updated all products with existing images\n');
    
    // Show final product list
    const result = await pool.query(`
      SELECT id, name, image_url, 
        CASE 
          WHEN image_url LIKE 'http%' THEN 'CLOUDINARY'
          ELSE 'LOCAL'
        END as type
      FROM products 
      ORDER BY id
    `);
    
    console.log('Final product images:\n');
    result.rows.forEach(row => {
      const type = row.type === 'CLOUDINARY' ? '🌐' : '📁';
      const url = row.image_url?.length > 60 ? row.image_url.substring(0, 60) + '...' : row.image_url;
      console.log(`${type} ${row.id.toString().padStart(2)}. ${row.name.padEnd(30)} ${url}`);
    });
    
    console.log(`\n✅ Total products: ${result.rows.length}`);
    console.log(`📁 Local images: ${result.rows.filter(r => r.type === 'LOCAL').length}`);
    console.log(`🌐 Cloudinary images: ${result.rows.filter(r => r.type === 'CLOUDINARY').length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

fixAllImages();
