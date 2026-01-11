const { Pool } = require('pg');

// Neon database connection
const pool = new Pool({
  host: 'ep-lively-flower-a18w6w64-pooler.ap-southeast-1.aws.neon.tech',
  port: 5432,
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_j6BbU0FHJhKL',
  ssl: { rejectUnauthorized: false }
});

const checkNeonData = async () => {
  console.log('🔍 Checking data in Neon database...\n');

  const client = await pool.connect();
  
  try {
    // Get all tables
    const tables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    console.log(`📋 Found ${tables.rows.length} tables\n`);
    
    // Count rows in each table
    for (const {tablename} of tables.rows) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${tablename}`);
        const count = parseInt(result.rows[0].count);
        if (count > 0) {
          console.log(`  ✅ ${tablename}: ${count} rows`);
        } else {
          console.log(`  ⚪ ${tablename}: 0 rows`);
        }
      } catch (e) {
        console.log(`  ❌ ${tablename}: Error - ${e.message}`);
      }
    }
    
    console.log('\n🎉 Neon database is ready!\n');
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
};

checkNeonData().catch(console.error);
