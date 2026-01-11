const { Pool } = require('pg');
const fs = require('fs');

// Neon database connection
const pool = new Pool({
  host: 'ep-lively-flower-a18w6w64-pooler.ap-southeast-1.aws.neon.tech',
  port: 5432,
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_j6BbU0FHJhKL',
  ssl: { rejectUnauthorized: false }
});

const importData = async () => {
  console.log('📥 Importing data to Neon database...\n');

  const client = await pool.connect();
  
  try {
    // Read exported data
    const exportData = JSON.parse(fs.readFileSync('neon_migration_data.json', 'utf8'));
    
    // Order matters due to foreign key constraints
    const tableOrder = [
      'users',
      'categories',
      'products',
      'product_variants',
      'subscription_plans',
      'delivery_areas',
      'wallets',
      'cart',
      'orders',
      'order_items',
      'user_plans',
      'plan_deliveries',
      'plan_modifications',
      'user_subscriptions',
      'delivery_calendar',
      'reviews',
      'coupons',
      'coupon_usage',
      'wishlist',
      'activity_logs',
      'order_tracking',
      'email_otp',
      'password_reset_tokens',
      'refresh_tokens',
      'wallet_transactions'
    ];

    await client.query('BEGIN');

    let totalImported = 0;

    for (const table of tableOrder) {
      const data = exportData[table];
      
      if (!data || data.length === 0) {
        console.log(`  ⏭️  ${table}: No data to import`);
        continue;
      }

      try {
        // Create savepoint before each table
        await client.query(`SAVEPOINT sp_${table}`);
        
        // Get valid columns from Neon table
      const tableInfo = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${table}' AND table_schema = 'public'
      `);
      const validColumns = tableInfo.rows.map(r => r.column_name);
      
      // Get column names from data, filtered to only valid columns
      const dataColumns = Object.keys(data[0]);
      const columns = dataColumns.filter(col => validColumns.includes(col));
      const columnNames = columns.join(', ');
      
      if (columns.length === 0) {
        console.log(`  ⚠️  ${table}: No matching columns found`);
        continue;
      }
      
      // Import each row
      let imported = 0;
      for (const row of data) {
        const values = columns.map(col => row[col]);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        const query = `INSERT INTO ${table} (${columnNames}) VALUES (${placeholders})`;
        
        try {
          await client.query(query, values);
          imported++;
        } catch (error) {
          // Handle duplicate keys or other errors
          if (error.code === '23505') { // Unique violation
            console.log(`  ⚠️  ${table}: Skipped duplicate row`);
          } else if (error.code === '23503') { // Foreign key violation
            console.log(`  ⚠️  ${table}: Skipped row with missing foreign key reference`);
          } else {
            console.log(`  ⚠️  ${table}: Error ${error.code}: ${error.message.substring(0, 100)}`);
          }
        }
      }
      
      if (imported !== data.length) {
        console.log(`  ✅ ${table}: Imported ${imported}/${data.length} rows (${data.length - imported} skipped)`);
      } else {
        console.log(`  ✅ ${table}: Imported ${imported} rows`);
      }

      totalImported += imported;

      // Reset sequence for id column
      try {
        await client.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE(MAX(id), 1)) FROM ${table}`);
      } catch (e) {
        // Some tables might not have an id column
      }
      
      // Release savepoint on success
      await client.query(`RELEASE SAVEPOINT sp_${table}`);
      
    } catch (tableError) {
      // Rollback to savepoint on error
      console.log(`  ❌ ${table}: Failed - ${tableError.message.substring(0, 100)}`);
      try {
        await client.query(`ROLLBACK TO SAVEPOINT sp_${table}`);
      } catch (e) {
        // Ignore rollback errors
      }
    }
  }

    await client.query('COMMIT');
    console.log(`\n🎉 Import complete! Total rows imported: ${totalImported}\n`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

importData().catch(console.error);
