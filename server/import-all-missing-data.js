const { Pool } = require('pg');
const fs = require('fs');

// Neon database connection
const neonPool = new Pool({
  host: 'ep-lively-flower-a18w6w64-pooler.ap-southeast-1.aws.neon.tech',
  port: 5432,
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_j6BbU0FHJhKL',
  ssl: { rejectUnauthorized: false }
});

// Local database connection (for fetching missing data)
const localPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ruralbowldb',
  user: 'postgres',
  password: 'Ruralbowl@2025',
});

const importAllData = async () => {
  console.log('📥 Comprehensive Data Import: Local → Neon\n');
  console.log('═══════════════════════════════════════════════════\n');

  const neonClient = await neonPool.connect();
  const localClient = await localPool.connect();
  
  try {
    let totalImported = 0;

    // 1. Import product_variants (with proper name field)
    console.log('📦 Importing product_variants...');
    const variantsResult = await localClient.query(`
      SELECT pv.*, p.name as product_name 
      FROM product_variants pv
      LEFT JOIN products p ON pv.product_id = p.id
      ORDER BY pv.id
    `);
    
    let variantsImported = 0;
    for (const variant of variantsResult.rows) {
      try {
        // Generate a name if missing
        const variantName = variant.name || `${variant.product_name} - ${variant.unit}`;
        
        await neonClient.query(`
          INSERT INTO product_variants (id, product_id, name, price, original_price, unit, unit_value, stock_quantity, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO NOTHING
        `, [
          variant.id,
          variant.product_id,
          variantName,
          variant.price,
          variant.original_price,
          variant.unit,
          variant.unit_value,
          variant.stock_quantity || 0,
          variant.is_active !== false,
          variant.created_at,
          variant.updated_at
        ]);
        variantsImported++;
      } catch (e) {
        console.log(`  ⚠️  Skipped variant ID ${variant.id}: ${e.message.substring(0, 50)}`);
      }
    }
    console.log(`  ✅ Imported ${variantsImported}/${variantsResult.rows.length} variants\n`);
    totalImported += variantsImported;

    // 2. Import subscription_plans (fix JSON format)
    console.log('📅 Importing subscription_plans...');
    const plansResult = await localClient.query('SELECT * FROM subscription_plans ORDER BY id');
    
    let plansImported = 0;
    for (const plan of plansResult.rows) {
      try {
        // Convert items to proper JSONB format
        let itemsJson = plan.items;
        if (typeof itemsJson === 'string') {
          itemsJson = JSON.parse(itemsJson);
        }
        
        await neonClient.query(`
          INSERT INTO subscription_plans (id, name, slug, description, price, original_price, interval, duration, features, items, is_popular, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO NOTHING
        `, [
          plan.id,
          plan.name,
          plan.slug,
          plan.description,
          plan.price,
          plan.original_price,
          plan.interval,
          plan.duration,
          plan.features,
          JSON.stringify(itemsJson), // Ensure proper JSON string
          plan.is_popular || false,
          plan.is_active !== false,
          plan.created_at,
          plan.updated_at
        ]);
        plansImported++;
      } catch (e) {
        console.log(`  ⚠️  Skipped plan ${plan.name}: ${e.message.substring(0, 50)}`);
      }
    }
    console.log(`  ✅ Imported ${plansImported}/${plansResult.rows.length} plans\n`);
    totalImported += plansImported;

    // 3. Import delivery_areas (handle missing pincode)
    console.log('🚚 Importing delivery_areas...');
    const areasResult = await localClient.query('SELECT * FROM delivery_areas ORDER BY id');
    
    let areasImported = 0;
    for (const area of areasResult.rows) {
      try {
        await neonClient.query(`
          INSERT INTO delivery_areas (id, area_name, pincode, city, state, delivery_fee, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO NOTHING
        `, [
          area.id,
          area.area_name,
          area.pincode || '000000', // Default pincode if missing
          area.city,
          area.state,
          area.delivery_fee || 0,
          area.is_active !== false,
          area.created_at,
          area.updated_at
        ]);
        areasImported++;
      } catch (e) {
        console.log(`  ⚠️  Skipped area ${area.area_name}: ${e.message.substring(0, 50)}`);
      }
    }
    console.log(`  ✅ Imported ${areasImported}/${areasResult.rows.length} delivery areas\n`);
    totalImported += areasImported;

    // 4. Import orders (handle missing order_number)
    console.log('🛒 Importing orders...');
    const ordersResult = await localClient.query('SELECT * FROM orders ORDER BY id');
    
    let ordersImported = 0;
    for (const order of ordersResult.rows) {
      try {
        // Generate order_number if missing
        const orderNumber = order.order_number || `ORD-${order.id}-${Date.now()}`;
        
        await neonClient.query(`
          INSERT INTO orders (id, user_id, session_id, order_number, status, subtotal, delivery_fee, discount, total, payment_method, payment_status, delivery_address, delivery_city, delivery_state, delivery_pincode, delivery_phone, delivery_date, notes, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
          ON CONFLICT (id) DO NOTHING
        `, [
          order.id,
          order.user_id,
          order.session_id,
          orderNumber,
          order.status || 'pending',
          order.subtotal,
          order.delivery_fee || 0,
          order.discount || 0,
          order.total,
          order.payment_method,
          order.payment_status || 'pending',
          order.delivery_address,
          order.delivery_city,
          order.delivery_state,
          order.delivery_pincode,
          order.delivery_phone,
          order.delivery_date,
          order.notes,
          order.created_at,
          order.updated_at
        ]);
        ordersImported++;
      } catch (e) {
        console.log(`  ⚠️  Skipped order ID ${order.id}: ${e.message.substring(0, 50)}`);
      }
    }
    console.log(`  ✅ Imported ${ordersImported}/${ordersResult.rows.length} orders\n`);
    totalImported += ordersImported;

    // 5. Import order_items (handle missing product_name)
    console.log('📝 Importing order_items...');
    const orderItemsResult = await localClient.query(`
      SELECT oi.*, p.name as product_name_from_product, pv.name as variant_name_from_variant
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_variants pv ON oi.variant_id = pv.id
      ORDER BY oi.id
    `);
    
    let itemsImported = 0;
    for (const item of orderItemsResult.rows) {
      try {
        // Use product name from join or fallback
        const productName = item.product_name || item.product_name_from_product || 'Unknown Product';
        const variantName = item.variant_name || item.variant_name_from_variant;
        
        await neonClient.query(`
          INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, variant_name, product_image, quantity, unit_price, total_price, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO NOTHING
        `, [
          item.id,
          item.order_id,
          item.product_id,
          item.variant_id,
          productName,
          variantName,
          item.product_image,
          item.quantity,
          item.unit_price,
          item.total_price,
          item.created_at
        ]);
        itemsImported++;
      } catch (e) {
        console.log(`  ⚠️  Skipped order item ID ${item.id}: ${e.message.substring(0, 50)}`);
      }
    }
    console.log(`  ✅ Imported ${itemsImported}/${orderItemsResult.rows.length} order items\n`);
    totalImported += itemsImported;

    // 6. Import user_plans (handle date fields)
    console.log('📋 Importing user_plans...');
    const userPlansResult = await localClient.query('SELECT * FROM user_plans ORDER BY id');
    
    let userPlansImported = 0;
    for (const userPlan of userPlansResult.rows) {
      try {
        await neonClient.query(`
          INSERT INTO user_plans (id, user_id, plan_id, status, start_date, end_date, payment_status, payment_method, amount_paid, delivery_address, delivery_city, delivery_state, delivery_pincode, delivery_phone, notes, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (id) DO NOTHING
        `, [
          userPlan.id,
          userPlan.user_id,
          userPlan.plan_id,
          userPlan.status || 'active',
          userPlan.start_date || new Date(),
          userPlan.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days if missing
          userPlan.payment_status || 'pending',
          userPlan.payment_method,
          userPlan.amount_paid,
          userPlan.delivery_address,
          userPlan.delivery_city,
          userPlan.delivery_state,
          userPlan.delivery_pincode,
          userPlan.delivery_phone,
          userPlan.notes,
          userPlan.created_at,
          userPlan.updated_at
        ]);
        userPlansImported++;
      } catch (e) {
        console.log(`  ⚠️  Skipped user plan ID ${userPlan.id}: ${e.message.substring(0, 50)}`);
      }
    }
    console.log(`  ✅ Imported ${userPlansImported}/${userPlansResult.rows.length} user plans\n`);
    totalImported += userPlansImported;

    // 7. Import plan_deliveries (handle date fields)
    console.log('📅 Importing plan_deliveries...');
    const deliveriesResult = await localClient.query('SELECT * FROM plan_deliveries ORDER BY id');
    
    let deliveriesImported = 0;
    for (const delivery of deliveriesResult.rows) {
      try {
        await neonClient.query(`
          INSERT INTO plan_deliveries (id, user_plan_id, delivery_date, status, skipped, skip_reason, delivered_at, notes, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO NOTHING
        `, [
          delivery.id,
          delivery.user_plan_id,
          delivery.delivery_date || new Date(),
          delivery.status || 'scheduled',
          delivery.skipped || false,
          delivery.skip_reason,
          delivery.delivered_at,
          delivery.notes,
          delivery.created_at,
          delivery.updated_at
        ]);
        deliveriesImported++;
      } catch (e) {
        console.log(`  ⚠️  Skipped delivery ID ${delivery.id}: ${e.message.substring(0, 50)}`);
      }
    }
    console.log(`  ✅ Imported ${deliveriesImported}/${deliveriesResult.rows.length} deliveries\n`);
    totalImported += deliveriesImported;

    // 8. Import email_otp
    console.log('📧 Importing email_otp...');
    const otpResult = await localClient.query('SELECT * FROM email_otp ORDER BY id');
    
    let otpImported = 0;
    for (const otp of otpResult.rows) {
      try {
        await neonClient.query(`
          INSERT INTO email_otp (id, email, otp_hash, expires_at, verified, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO NOTHING
        `, [
          otp.id,
          otp.email,
          otp.otp_hash || 'expired_hash',
          otp.expires_at || new Date(),
          otp.verified || false,
          otp.created_at
        ]);
        otpImported++;
      } catch (e) {
        console.log(`  ⚠️  Skipped OTP: ${e.message.substring(0, 50)}`);
      }
    }
    console.log(`  ✅ Imported ${otpImported}/${otpResult.rows.length} OTP records\n`);
    totalImported += otpImported;

    // Reset sequences for all tables
    console.log('🔄 Resetting ID sequences...');
    const tables = ['product_variants', 'subscription_plans', 'delivery_areas', 'orders', 'order_items', 'user_plans', 'plan_deliveries', 'email_otp'];
    for (const table of tables) {
      try {
        await neonClient.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), true)`);
      } catch (e) {
        // Ignore if no sequence
      }
    }
    console.log('  ✅ Sequences updated\n');

    console.log('═══════════════════════════════════════════════════');
    console.log(`🎉 Complete! Imported ${totalImported} total rows`);
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error(error);
  } finally {
    neonClient.release();
    localClient.release();
    await neonPool.end();
    await localPool.end();
  }
};

importAllData();
