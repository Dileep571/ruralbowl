// Script to check and seed categories in the database
const db = require('./server/src/config/database');

const checkAndSeedCategories = async () => {
  try {
    console.log('🔍 Checking categories in database...\n');

    // Check existing categories
    const result = await db.query('SELECT * FROM categories ORDER BY id');
    
    console.log(`Found ${result.rows.length} categories:\n`);
    result.rows.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug})`);
      console.log(`    ID: ${cat.id}, Image: ${cat.image_url || 'No image'}`);
    });

    if (result.rows.length === 0) {
      console.log('\n❌ No categories found! Seeding default categories...\n');
      
      // Insert default categories
      await db.query(`
        INSERT INTO categories (name, slug, description, image_url) VALUES
          ('Vegetables', 'vegetables', 'Fresh organic vegetables', '/images/vegetables-category.jpeg'),
          ('Rice', 'rice', 'Premium quality rice varieties', '/images/rice-category.jpg')
        ON CONFLICT (slug) DO UPDATE SET 
          description = EXCLUDED.description,
          image_url = EXCLUDED.image_url
      `);

      console.log('✅ Default categories seeded!\n');
      
      // Check again
      const newResult = await db.query('SELECT * FROM categories ORDER BY id');
      console.log(`Now have ${newResult.rows.length} categories:\n`);
      newResult.rows.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.slug})`);
        console.log(`    ID: ${cat.id}, Image: ${cat.image_url || 'No image'}`);
      });
    }

    console.log('\n✅ Category check complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

checkAndSeedCategories();
