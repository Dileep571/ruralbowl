const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ruralbowl',
  password: 'Vasanth@123',
  port: 5432,
});

async function fixImages() {
  try {
    // Update all vegetables to use tomatoes-1.jpg
    await pool.query(`
      UPDATE products 
      SET image_url = '/images/vegetables/tomatoes-1.jpg'
      WHERE category_id = (SELECT id FROM categories WHERE name = 'Vegetables')
      AND image_url LIKE '/images/vegetables/%'
    `);
    
    // Update all rice to use basmati-1.jpg
    await pool.query(`
      UPDATE products 
      SET image_url = '/images/rice/basmati-1.jpg'
      WHERE category_id = (SELECT id FROM categories WHERE name = 'Rice')
      AND image_url LIKE '/images/rice/%'
    `);
    
    console.log('✅ Updated all product images to use existing files');
    
    // Show updated products
    const result = await pool.query(`
      SELECT id, name, image_url 
      FROM products 
      ORDER BY id 
      LIMIT 10
    `);
    
    console.log('\nUpdated products:');
    result.rows.forEach(row => {
      console.log(`${row.id}. ${row.name}: ${row.image_url}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

fixImages();
