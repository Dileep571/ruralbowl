const db = require('./database');

/**
 * Quick script to add products to database
 * Usage: node src/config/addProduct.js
 */

async function addProducts() {
  try {
    console.log('🌾 Adding products to RuralBowl...\n');

    // Get categories first
    const categoriesResult = await db.query('SELECT id, name, slug FROM categories');
    console.log('📦 Available categories:');
    categoriesResult.rows.forEach(cat => {
      console.log(`   ${cat.id}. ${cat.name} (${cat.slug})`);
    });
    console.log('');

    // Add your products here
    const newProducts = [
      {
        name: 'Fresh Potatoes',
        slug: 'fresh-potatoes',
        description: 'Farm fresh potatoes, perfect for cooking and frying',
        price: 60,
        unit: 'kg',
        category_id: 1, // vegetables
        image_url: '/images/vegetables/potatoes-1.jpg',
        stock_quantity: 100
      },
      {
        name: 'Organic Onions',
        slug: 'organic-onions',
        description: 'Locally grown organic onions, essential for every kitchen',
        price: 70,
        unit: 'kg',
        category_id: 1, // vegetables
        image_url: '/images/vegetables/onions-1.jpg',
        stock_quantity: 80
      },
      {
        name: 'Fresh Cauliflower',
        slug: 'fresh-cauliflower',
        description: 'White cauliflower heads, rich in nutrients',
        price: 100,
        unit: 'kg',
        category_id: 1, // vegetables
        image_url: '/images/vegetables/cauliflower-1.jpg',
        stock_quantity: 45
      },
      {
        name: 'Organic Wheat',
        slug: 'organic-wheat',
        description: 'Whole grain organic wheat, stone ground',
        price: 120,
        unit: 'kg',
        category_id: 2, // rice (or create grains category)
        image_url: '/images/grains/wheat-1.jpg',
        stock_quantity: 150
      }
    ];

    console.log(`➕ Adding ${newProducts.length} new products...\n`);

    for (const product of newProducts) {
      try {
        const result = await db.query(
          `INSERT INTO products (name, slug, description, price, unit, category_id, image_url, stock_quantity, is_available)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
           ON CONFLICT (slug) DO UPDATE SET
             stock_quantity = products.stock_quantity + EXCLUDED.stock_quantity,
             price = EXCLUDED.price,
             updated_at = CURRENT_TIMESTAMP
           RETURNING id, name, price`,
          [product.name, product.slug, product.description, product.price, product.unit, 
           product.category_id, product.image_url, product.stock_quantity]
        );
        console.log(`   ✅ ${result.rows[0].name} - ₹${result.rows[0].price}/${product.unit}`);
      } catch (err) {
        console.error(`   ❌ Failed to add ${product.name}:`, err.message);
      }
    }

    // Show total products
    const totalResult = await db.query('SELECT COUNT(*) FROM products');
    console.log(`\n✅ Total products in database: ${totalResult.rows[0].count}`);

    await db.pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await db.pool.end();
    process.exit(1);
  }
}

addProducts();
