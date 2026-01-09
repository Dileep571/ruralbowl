const db = require('./src/config/database');

async function checkCategory() {
  try {
    const result = await db.query('SELECT * FROM categories LIMIT 1');
    console.log('Sample category data:');
    console.log(JSON.stringify(result.rows[0], null, 2));
    
    const columns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'categories' 
      ORDER BY ordinal_position
    `);
    console.log('\nCategories table structure:');
    columns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCategory();
