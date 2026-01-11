const { Pool } = require('pg');

const neonPool = new Pool({
  host: 'ep-lively-flower-a18w6w64-pooler.ap-southeast-1.aws.neon.tech',
  port: 5432,
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_j6BbU0FHJhKL',
  ssl: { rejectUnauthorized: false }
});

const localPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ruralbowldb',
  user: 'postgres',
  password: 'Ruralbowl@2025',
});

const importCompleteData = async () => {
  console.log('📥 Complete Data Migration: Local → Neon\n');
  console.log('═══════════════════════════════════════════════════\n');

  const neonClient = await neonPool.connect();
  const localClient = await localPool.connect();
  
  try {
    let totalImported = 0;

    // 1. Product Variants - Map old schema to new schema
    console.log('📦 Importing product_variants...');
    const variantsResult = await localClient.query(`
      SELECT pv.*, p.name as product_name 
      FROM product_variants pv
      LEFT JOIN products p ON pv.product_id = p.id
      ORDER BY pv.id
    `);
    
    let variantsImported = 0;
    for (const v of variantsResult.rows) {
      try {
        const name = `${v.variant_name}: ${v.variant_value}`;
        const unit = v.variant_value.replace(/[0-9.]/g, '').trim() || 'kg';
        const unitValue = parseFloat(v.variant_value.replace(/[^0-9.]/g, '')) || 1;
        
        await neonClient.query(`
          INSERT INTO product_variants (id, product_id, name, price, original_price, unit, unit_value, stock_quantity, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO NOTHING
        `, [
          v.id,
          v.product_id,
          name,
          v.price,
          v.original_price,
          unit,
          unitValue,
          v.stock_quantity || 0,
          v.is_available !== false,
          v.created_at,
          v.updated_at
        ]);
        variantsImported++;
      } catch (e) {
        console.log(`  ⚠️  Variant ${v.id}: ${e.message.substring(0, 60)}`);
      }
    }
    console.log(`  ✅ Imported ${variantsImported}/${variantsResult.rows.length} variants\n`);
    totalImported += variantsImported;

    // 2. Subscription Plans - Map old schema to new schema
    console.log('📅 Importing subscription_plans...');
    const plansResult = await localClient.query('SELECT * FROM subscription_plans ORDER BY id');
    
    let plansImported = 0;
    for (const p of plansResult.rows) {
      try {
        const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const interval = p.delivery_frequency || 'weekly';
        const duration = `${p.validity_days} days`;
        const features = [
          `${p.total_deliveries} deliveries`,
          `${p.delivery_frequency} delivery`,
          `${p.validity_days} days validity`
        ];
        
        await neonClient.query(`
          INSERT INTO subscription_plans (id, name, slug, description, price, original_price, interval, duration, features, items, is_popular, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            price = EXCLUDED.price
        `, [
          p.id,
          p.name,
          slug,
          p.description,
          p.price,
          parseFloat(p.price) * (1 + parseFloat(p.discount_percentage) / 100),
          interval,
          duration,
          features,
          JSON.stringify(p.items),
          false,
          p.is_active !== false,
          p.created_at,
          p.updated_at
        ]);
        plansImported++;
      } catch (e) {
        console.log(`  ⚠️  Plan ${p.name}: ${e.message.substring(0, 60)}`);
      }
    }
    console.log(`  ✅ Imported ${plansImported}/${plansResult.rows.length} plans\n`);
    totalImported += plansImported;

    // 3. Orders - Map old schema to new schema
    console.log('🛒 Importing orders...');
    const ordersResult = await localClient.query('SELECT * FROM orders ORDER BY id');
    
    let ordersImported = 0;
    for (const o of ordersResult.rows) {
      try {
        const orderNumber = `ORD-${String(o.id).padStart(6, '0')}-${new Date(o.created_at).getTime()}`;
        
        await neonClient.query(`
          INSERT INTO orders (id, user_id, session_id, order_number, status, subtotal, delivery_fee, discount, total, payment_method, payment_status, delivery_address, delivery_city, delivery_state, delivery_pincode, delivery_phone, delivery_date, notes, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
          ON CONFLICT (id) DO NOTHING
        `, [
          o.id,
          o.user_id,
          null, // session_id
          orderNumber,
          o.status || 'pending',
          o.subtotal || o.total_amount,
          0, // delivery_fee
          o.discount_amount || 0,
          o.total_amount,
          o.payment_method,
          o.payment_status || 'pending',
          o.shipping_address,
          null, // delivery_city
          null, // delivery_state
          null, // delivery_pincode
          null, // delivery_phone
          o.expected_delivery_date,
          o.notes,
          o.created_at,
          o.updated_at
        ]);
        ordersImported++;
      } catch (e) {
        console.log(`  ⚠️  Order ${o.id}: ${e.message.substring(0, 60)}`);
      }
    }
    console.log(`  ✅ Imported ${ordersImported}/${ordersResult.rows.length} orders\n`);
    totalImported += ordersImported;

    // 4. Order Items - Map old schema to new schema
    console.log('📝 Importing order_items...');
    const orderItemsResult = await localClient.query(`
      SELECT oi.*, p.name as product_name, p.image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      ORDER BY oi.id
    `);
    
    let itemsImported = 0;
    for (const item of orderItemsResult.rows) {
      try {
        await neonClient.query(`
          INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, variant_name, product_image, quantity, unit_price, total_price, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO NOTHING
        `, [
          item.id,
          item.order_id,
          item.product_id,
          item.variant_id,
          item.product_name || 'Unknown Product',
          item.variant_name,
          item.image_url,
          item.quantity,
          item.price,
          parseFloat(item.price) * item.quantity,
          item.created_at
        ]);
        itemsImported++;
      } catch (e) {
        console.log(`  ⚠️  Order item ${item.id}: ${e.message.substring(0, 60)}`);
      }
    }
    console.log(`  ✅ Imported ${itemsImported}/${orderItemsResult.rows.length} order items\n`);
    totalImported += itemsImported;

    // 5. User Plans
    console.log('📋 Importing user_plans...');
    const userPlansResult = await localClient.query('SELECT * FROM user_plans ORDER BY id');
    
    let userPlansImported = 0;
    for (const up of userPlansResult.rows) {
      try {
        await neonClient.query(`
          INSERT INTO user_plans (id, user_id, plan_id, status, start_date, end_date, payment_status, payment_method, amount_paid, delivery_address, delivery_city, delivery_state, delivery_pincode, delivery_phone, notes, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (id) DO NOTHING
        `, [
          up.id,
          up.user_id,
          up.plan_id,
          up.status || 'active',
          up.start_date || up.created_at,
          up.end_date || new Date(new Date(up.created_at).getTime() + 90 * 24 * 60 * 60 * 1000),
          up.payment_status || 'completed',
          up.payment_method || 'cod',
          up.total_amount_paid,
          up.delivery_address,
          null,
          null,
          null,
          null,
          null,
          up.created_at,
          up.updated_at
        ]);
        userPlansImported++;
      } catch (e) {
        console.log(`  ⚠️  User plan ${up.id}: ${e.message.substring(0, 60)}`);
      }
    }
    console.log(`  ✅ Imported ${userPlansImported}/${userPlansResult.rows.length} user plans\n`);
    totalImported += userPlansImported;

    // 6. Plan Deliveries
    console.log('📅 Importing plan_deliveries...');
    const deliveriesResult = await localClient.query('SELECT * FROM plan_deliveries ORDER BY id');
    
    let deliveriesImported = 0;
    for (const d of deliveriesResult.rows) {
      try {
        await neonClient.query(`
          INSERT INTO plan_deliveries (id, user_plan_id, delivery_date, status, skipped, skip_reason, delivered_at, notes, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO NOTHING
        `, [
          d.id,
          d.user_plan_id,
          d.scheduled_date || d.created_at,
          d.status || 'scheduled',
          d.is_skipped || false,
          d.skip_reason,
          d.delivered_at,
          d.notes,
          d.created_at,
          d.updated_at
        ]);
        deliveriesImported++;
      } catch (e) {
        console.log(`  ⚠️  Delivery ${d.id}: ${e.message.substring(0, 60)}`);
      }
    }
    console.log(`  ✅ Imported ${deliveriesImported}/${deliveriesResult.rows.length} deliveries\n`);
    totalImported += deliveriesImported;

    // Reset sequences
    console.log('🔄 Resetting ID sequences...');
    const tables = ['product_variants', 'subscription_plans', 'orders', 'order_items', 'user_plans', 'plan_deliveries'];
    for (const table of tables) {
      try {
        await neonClient.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), true)`);
      } catch (e) {}
    }
    console.log('  ✅ Sequences updated\n');

    console.log('═══════════════════════════════════════════════════');
    console.log(`🎉 Success! Imported ${totalImported} total rows`);
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

importCompleteData();
