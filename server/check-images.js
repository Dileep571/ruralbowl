// Check product image URLs
const db = require('./src/config/database');

(async () => {
  try {
    const result = await db.query('SELECT id, name, image_url FROM products LIMIT 10');
    console.log('\nProduct image URLs in database:\n');
    result.rows.forEach(p => {
      console.log(`- ${p.name}: ${p.image_url}`);
    });
    console.log('\n');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
})();
