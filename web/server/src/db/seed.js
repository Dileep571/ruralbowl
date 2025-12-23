require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./config');

const seed = async () => {
  console.log('🌱 Seeding database...\n');

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Seed Categories
    const categories = [
      { name: 'Vegetables', slug: 'vegetables', description: 'Fresh organic vegetables', image_url: '/images/vegetables/category.png' },
      { name: 'Rice', slug: 'rice', description: 'Premium quality rice varieties', image_url: '/images/rice/category.png' },
      { name: 'Mangoes', slug: 'mangoes', description: 'Seasonal mangoes from rural farms', image_url: '/images/mangoes/category.png' },
      { name: 'Fruits', slug: 'fruits', description: 'Fresh seasonal fruits', image_url: '/images/fruits/category.png' },
    ];

    for (const cat of categories) {
      await client.query(`
        INSERT INTO categories (name, slug, description, image_url)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (slug) DO UPDATE SET name = $1, description = $3, image_url = $4
      `, [cat.name, cat.slug, cat.description, cat.image_url]);
    }
    console.log('✅ Categories seeded');

    // Get category IDs
    const catResult = await client.query('SELECT id, slug FROM categories');
    const categoryMap = {};
    catResult.rows.forEach(row => { categoryMap[row.slug] = row.id; });

    // Seed Products
    const products = [
      // Vegetables
      { name: 'Fresh Tomatoes', slug: 'fresh-tomatoes', description: 'Farm fresh organic tomatoes', price: 40, original_price: 50, unit: 'kg', stock_quantity: 100, category_id: categoryMap.vegetables, image_url: '/images/vegetables/tomatoes.png', is_featured: true },
      { name: 'Green Spinach', slug: 'green-spinach', description: 'Nutritious green spinach leaves', price: 30, original_price: 40, unit: 'bunch', stock_quantity: 80, category_id: categoryMap.vegetables, image_url: '/images/vegetables/spinach.png', is_featured: true },
      { name: 'Fresh Potatoes', slug: 'fresh-potatoes', description: 'Organic potatoes from local farms', price: 35, original_price: 45, unit: 'kg', stock_quantity: 150, category_id: categoryMap.vegetables, image_url: '/images/vegetables/potatoes.png', is_featured: false },
      { name: 'Onions', slug: 'onions', description: 'Fresh red onions', price: 30, original_price: 40, unit: 'kg', stock_quantity: 200, category_id: categoryMap.vegetables, image_url: '/images/vegetables/onions.png', is_featured: false },
      { name: 'Carrots', slug: 'carrots', description: 'Crunchy organic carrots', price: 45, original_price: 55, unit: 'kg', stock_quantity: 90, category_id: categoryMap.vegetables, image_url: '/images/vegetables/carrots.png', is_featured: true },
      { name: 'Green Beans', slug: 'green-beans', description: 'Fresh green beans', price: 60, original_price: 75, unit: 'kg', stock_quantity: 70, category_id: categoryMap.vegetables, image_url: '/images/vegetables/beans.png', is_featured: false },
      { name: 'Cauliflower', slug: 'cauliflower', description: 'Fresh white cauliflower', price: 40, original_price: 50, unit: 'piece', stock_quantity: 60, category_id: categoryMap.vegetables, image_url: '/images/vegetables/cauliflower.png', is_featured: false },
      { name: 'Cabbage', slug: 'cabbage', description: 'Fresh green cabbage', price: 35, original_price: 45, unit: 'piece', stock_quantity: 80, category_id: categoryMap.vegetables, image_url: '/images/vegetables/cabbage.png', is_featured: false },
      
      // Rice
      { name: 'Basmati Rice', slug: 'basmati-rice', description: 'Premium long grain basmati rice', price: 150, original_price: 180, unit: 'kg', stock_quantity: 200, category_id: categoryMap.rice, image_url: '/images/rice/basmati.png', is_featured: true },
      { name: 'Brown Rice', slug: 'brown-rice', description: 'Healthy organic brown rice', price: 120, original_price: 140, unit: 'kg', stock_quantity: 150, category_id: categoryMap.rice, image_url: '/images/rice/brown.png', is_featured: true },
      { name: 'Sona Masoori Rice', slug: 'sona-masoori-rice', description: 'Light and aromatic sona masoori', price: 80, original_price: 100, unit: 'kg', stock_quantity: 180, category_id: categoryMap.rice, image_url: '/images/rice/sona-masoori.png', is_featured: false },
      
      // Mangoes
      { name: 'Alphonso Mangoes', slug: 'alphonso-mangoes', description: 'King of mangoes - Alphonso', price: 500, original_price: 600, unit: 'dozen', stock_quantity: 50, category_id: categoryMap.mangoes, image_url: '/images/mangoes/alphonso.png', is_featured: true },
      { name: 'Kesar Mangoes', slug: 'kesar-mangoes', description: 'Sweet and aromatic Kesar mangoes', price: 400, original_price: 480, unit: 'dozen', stock_quantity: 60, category_id: categoryMap.mangoes, image_url: '/images/mangoes/kesar.png', is_featured: true },
      { name: 'Totapuri Mangoes', slug: 'totapuri-mangoes', description: 'Tangy Totapuri mangoes', price: 200, original_price: 250, unit: 'dozen', stock_quantity: 80, category_id: categoryMap.mangoes, image_url: '/images/mangoes/totapuri.png', is_featured: false },
    ];

    for (const prod of products) {
      await client.query(`
        INSERT INTO products (name, slug, description, price, original_price, unit, stock_quantity, category_id, image_url, is_featured)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (slug) DO UPDATE SET 
          name = $1, description = $3, price = $4, original_price = $5, 
          unit = $6, stock_quantity = $7, category_id = $8, image_url = $9, is_featured = $10
      `, [prod.name, prod.slug, prod.description, prod.price, prod.original_price, prod.unit, prod.stock_quantity, prod.category_id, prod.image_url, prod.is_featured]);
    }
    console.log('✅ Products seeded');

    // Seed Subscription Plans
    const plans = [
      {
        name: 'Weekly Veg Box',
        slug: 'weekly',
        description: 'Fresh seasonal vegetables delivered every week',
        price: 399,
        original_price: 499,
        interval: 'week',
        duration: '1 week',
        features: ['5-6 different seasonal vegetables', 'Serves 2-3 people', 'Free delivery', 'Customizable preferences'],
        items: ['Tomatoes', 'Potatoes', 'Onions', 'Leafy Greens', 'Seasonal Special'],
        is_popular: true
      },
      {
        name: '15 Days Vegetable Plan',
        slug: 'biweekly',
        description: 'Perfect for small families, delivered every 15 days',
        price: 549,
        original_price: 699,
        interval: '15 days',
        duration: '15 days',
        features: ['7-8 different seasonal vegetables', 'Serves 3-4 people', 'Free delivery', 'Recipe suggestions included'],
        items: ['Tomatoes', 'Potatoes', 'Onions', 'Carrots', 'Beans', 'Leafy Greens', 'Seasonal Mix'],
        is_popular: false
      },
      {
        name: 'Monthly Vegetable Subscription',
        slug: 'monthly',
        description: 'Complete vegetable solution for the entire month',
        price: 999,
        original_price: 1299,
        interval: 'month',
        duration: '1 month',
        features: ['10-12 different seasonal vegetables', 'Serves 4-5 people', 'Free delivery', 'Weekly recipe guides', 'Priority support'],
        items: ['Tomatoes', 'Potatoes', 'Onions', 'Carrots', 'Beans', 'Cabbage', 'Cauliflower', 'Leafy Greens', 'Seasonal Mix', 'Herbs'],
        is_popular: false
      },
      {
        name: 'Premium Family Plan',
        slug: 'premium',
        description: 'Premium vegetables + fruits + rice combo for large families',
        price: 1999,
        original_price: 2499,
        interval: 'month',
        duration: '1 month',
        features: ['15+ different items', 'Serves 5-6 people', 'Free express delivery', 'Includes premium rice', 'Seasonal fruits included', '24/7 support'],
        items: ['All vegetables', 'Basmati Rice (5kg)', 'Seasonal Fruits', 'Herbs & Spices', 'Premium Selection'],
        is_popular: false
      }
    ];

    for (const plan of plans) {
      await client.query(`
        INSERT INTO subscription_plans (name, slug, description, price, original_price, interval, duration, features, items, is_popular)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (slug) DO UPDATE SET 
          name = $1, description = $3, price = $4, original_price = $5, 
          interval = $6, duration = $7, features = $8, items = $9, is_popular = $10
      `, [plan.name, plan.slug, plan.description, plan.price, plan.original_price, plan.interval, plan.duration, plan.features, plan.items, plan.is_popular]);
    }
    console.log('✅ Subscription Plans seeded');

    // Seed Admin User
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    await client.query(`
      INSERT INTO admin_users (username, password, name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (username) DO UPDATE SET password = $2, name = $3
    `, [process.env.ADMIN_USERNAME || 'admin', adminPassword, 'Administrator', 'super_admin']);
    console.log('✅ Admin user seeded');

    await client.query('COMMIT');
    console.log('\n✅ All seed data inserted successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

seed().catch(console.error);
