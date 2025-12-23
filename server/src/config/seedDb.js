const db = require('./database');

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Insert subscription plans
    await db.query(`
      INSERT INTO subscription_plans (name, description, price, validity_days, total_deliveries, delivery_frequency, default_delivery_days, is_active) VALUES
        ('Weekly Veggie Plan', 'Fresh vegetables delivered every week for 12 weeks', 2400, 90, 12, 'weekly', ARRAY['monday'], true),
        ('Bi-Weekly Rice Plan', 'Premium rice delivered every two weeks', 1800, 90, 6, 'biweekly', ARRAY['saturday'], true),
        ('Monthly Mixed Plan', 'Vegetables, rice and fruits - monthly deliveries', 3600, 120, 4, 'custom', ARRAY['friday'], true)
      ON CONFLICT DO NOTHING
    `);
    console.log('✓ Subscription plans inserted');

    // Get category IDs
    const categoriesResult = await db.query('SELECT id, slug FROM categories');
    const categories = {};
    categoriesResult.rows.forEach(cat => {
      categories[cat.slug] = cat.id;
    });

    // Insert products
    const products = [
      // Vegetables
      {
        name: 'Organic Tomatoes',
        slug: 'organic-tomatoes',
        description: 'Fresh organic tomatoes grown without synthetic pesticides, harvested at peak ripeness.',
        price: 120,
        unit: 'kg',
        category_id: categories['vegetables'],
        image_url: '/images/vegetables/tomatoes-1.jpg',
        stock_quantity: 50
      },
      {
        name: 'Fresh Spinach',
        slug: 'fresh-spinach',
        description: 'Nutrient-rich organic spinach, perfect for salads and cooking.',
        price: 80,
        unit: 'kg',
        category_id: categories['vegetables'],
        image_url: '/images/vegetables/spinach-1.jpg',
        stock_quantity: 40
      },
      {
        name: 'Green Capsicum',
        slug: 'green-capsicum',
        description: 'Crisp and fresh bell peppers, ideal for salads and stir-fry.',
        price: 150,
        unit: 'kg',
        category_id: categories['vegetables'],
        image_url: '/images/vegetables/capsicum-1.jpg',
        stock_quantity: 35
      },
      {
        name: 'Organic Carrots',
        slug: 'organic-carrots',
        description: 'Sweet and crunchy organic carrots, great for juicing and cooking.',
        price: 90,
        unit: 'kg',
        category_id: categories['vegetables'],
        image_url: '/images/vegetables/carrots-1.jpg',
        stock_quantity: 60
      },
      {
        name: 'Fresh Broccoli',
        slug: 'fresh-broccoli',
        description: 'Nutritious green broccoli florets, rich in vitamins.',
        price: 180,
        unit: 'kg',
        category_id: categories['vegetables'],
        image_url: '/images/vegetables/broccoli-1.jpg',
        stock_quantity: 30
      },
      
      // Rice varieties
      {
        name: 'Basmati Rice',
        slug: 'basmati-rice',
        description: 'Premium aged basmati rice with long grains and aromatic flavor.',
        price: 180,
        unit: 'kg',
        category_id: categories['rice'],
        image_url: '/images/rice/basmati-1.jpg',
        stock_quantity: 100
      },
      {
        name: 'Brown Rice',
        slug: 'brown-rice',
        description: 'Healthy whole grain brown rice, rich in fiber and nutrients.',
        price: 160,
        unit: 'kg',
        category_id: categories['rice'],
        image_url: '/images/rice/brown-1.jpg',
        stock_quantity: 80
      },
      {
        name: 'Sona Masoori Rice',
        slug: 'sona-masoori-rice',
        description: 'Lightweight and aromatic rice, perfect for daily meals.',
        price: 140,
        unit: 'kg',
        category_id: categories['rice'],
        image_url: '/images/rice/sona-masoori-1.jpg',
        stock_quantity: 120
      },
      
      // Mangoes
      {
        name: 'Alphonso Mangoes',
        slug: 'alphonso-mangoes',
        description: 'King of mangoes - rich, creamy texture with sweet flavor.',
        price: 500,
        unit: 'dozen',
        category_id: categories['mangoes'],
        image_url: '/images/mangoes/alphonso-1.jpg',
        stock_quantity: 25
      },
      {
        name: 'Kesar Mangoes',
        slug: 'kesar-mangoes',
        description: 'Aromatic and sweet mangoes with distinctive saffron color.',
        price: 450,
        unit: 'dozen',
        category_id: categories['mangoes'],
        image_url: '/images/mangoes/kesar-1.jpg',
        stock_quantity: 30
      },
      {
        name: 'Totapuri Mangoes',
        slug: 'totapuri-mangoes',
        description: 'Tangy and firm mangoes, excellent for pickles and salads.',
        price: 300,
        unit: 'dozen',
        category_id: categories['mangoes'],
        image_url: '/images/mangoes/totapuri-1.jpg',
        stock_quantity: 40
      }
    ];

    for (const product of products) {
      await db.query(
        `INSERT INTO products (name, slug, description, price, unit, category_id, image_url, stock_quantity, is_available)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         ON CONFLICT (slug) DO UPDATE SET
           stock_quantity = products.stock_quantity + EXCLUDED.stock_quantity,
           price = EXCLUDED.price,
           updated_at = CURRENT_TIMESTAMP`,
        [product.name, product.slug, product.description, product.price, product.unit, 
         product.category_id, product.image_url, product.stock_quantity]
      );
    }
    console.log('✓ Products inserted');

    // Get counts
    const planCount = await db.query('SELECT COUNT(*) FROM subscription_plans');
    const productCount = await db.query('SELECT COUNT(*) FROM products');
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Subscription Plans: ${planCount.rows[0].count}`);
    console.log(`   - Products: ${productCount.rows[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
