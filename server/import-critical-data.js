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
  console.log('📥 Importing critical data to Neon database...\n');

  const client = await pool.connect();
  
  try {
    const exportData = JSON.parse(fs.readFileSync('neon_migration_data.json', 'utf8'));
    
    // Import only critical tables without transactions
    const criticalTables = [
      'users',
      'categories',
      'products',
      'cart',
      'wishlist',
      'wallets',
      'refresh_tokens',
      'password_reset_tokens'
    ];

    let totalImported = 0;

    for (const table of criticalTables) {
      const data = exportData[table];
      
      if (!data || data.length === 0) {
        console.log(`  ⏭️  ${table}: No data`);
        continue;
      }

      // Get valid columns
      const tableInfo = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${table}' AND table_schema = 'public'
      `);
      const validColumns = tableInfo.rows.map(r => r.column_name);
      
      const dataColumns = Object.keys(data[0]);
      const columns = dataColumns.filter(col => validColumns.includes(col));
      const columnNames = columns.join(', ');
      
      let imported = 0;
      for (const row of data) {
        const values = columns.map(col => row[col]);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        const query = `INSERT INTO ${table} (${columnNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
        
        try {
          const result = await client.query(query, values);
          if (result.rowCount > 0) imported++;
        } catch (error) {
          // Silently skip errors
        }
      }

      console.log(`  ✅ ${table}: Imported ${imported} rows`);
      totalImported += imported;

      // Reset sequence
      try {
        await client.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), false)`);
      } catch (e) {}
    }

    console.log(`\n🎉 Import complete! Total: ${totalImported} rows\n`);
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
};

importData().catch(console.error);
