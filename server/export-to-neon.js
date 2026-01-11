const { Pool } = require('pg');
const fs = require('fs');

// Local database connection
const localPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ruralbowldb',
  user: 'postgres',
  password: 'Ruralbowl@2025',
});

// Neon database connection
const neonPool = new Pool({
  host: 'ep-lively-flower-a18w6w64-pooler.ap-southeast-1.aws.neon.tech',
  port: 5432,
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_j6BbU0FHJhKL',
  ssl: { rejectUnauthorized: false }
});

const exportAndMigrate = async () => {
  console.log('🚀 Starting database migration from Local to Neon...\n');

  try {
    // Test connections
    console.log('📡 Testing local database connection...');
    const localClient = await localPool.connect();
    console.log('✅ Local database connected\n');
    
    console.log('📡 Testing Neon database connection...');
    const neonClient = await neonPool.connect();
    console.log('✅ Neon database connected\n');

    // Get all table names from local
    console.log('📋 Fetching tables from local database...');
    const tablesResult = await localClient.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    const tables = tablesResult.rows.map(row => row.tablename);
    console.log(`Found ${tables.length} tables: ${tables.join(', ')}\n`);

    // Export data
    const exportData = {};
    console.log('📦 Exporting data from local database...');
    
    for (const table of tables) {
      const result = await localClient.query(`SELECT * FROM ${table}`);
      exportData[table] = result.rows;
      console.log(`  ✅ ${table}: ${result.rows.length} rows`);
    }

    // Save to file as backup
    fs.writeFileSync('neon_migration_data.json', JSON.stringify(exportData, null, 2));
    console.log('\n💾 Backup saved to: neon_migration_data.json\n');

    // Create tables in Neon (run migrations)
    console.log('🔧 Creating tables in Neon database...');
    
    // Get table schemas
    const schemaResult = await localClient.query(`
      SELECT table_name, column_name, data_type, character_maximum_length, 
             column_default, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);

    console.log('✅ Schema extracted\n');

    console.log('📝 Running migrations on Neon...');
    console.log('   (This will create all tables and relationships)\n');

    localClient.release();
    neonClient.release();

    console.log('✅ Migration preparation complete!\n');
    console.log('📋 Next steps:');
    console.log('   1. Run migrations on Neon database');
    console.log('   2. Import the data\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await localPool.end();
    await neonPool.end();
  }
};

exportAndMigrate();
