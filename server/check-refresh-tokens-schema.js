const { Pool } = require('pg');
require('dotenv').config();

const isNeonDatabase = process.env.DB_HOST && process.env.DB_HOST.includes('neon.tech');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: isNeonDatabase ? { rejectUnauthorized: false } : false,
});

async function checkSchema() {
  try {
    // Check refresh_tokens table structure
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'refresh_tokens'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n=== REFRESH_TOKENS TABLE COLUMNS ===');
    columnsResult.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check constraints and indexes
    const constraintsResult = await pool.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'refresh_tokens';
    `);
    
    console.log('\n=== REFRESH_TOKENS CONSTRAINTS ===');
    constraintsResult.rows.forEach(row => {
      console.log(`${row.constraint_name}: ${row.constraint_type}`);
    });

    // Check indexes
    const indexesResult = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'refresh_tokens';
    `);
    
    console.log('\n=== REFRESH_TOKENS INDEXES ===');
    indexesResult.rows.forEach(row => {
      console.log(`${row.indexname}:`);
      console.log(`  ${row.indexdef}`);
    });

    // Check subscription_plans table structure
    const planColumnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'subscription_plans'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n=== SUBSCRIPTION_PLANS TABLE COLUMNS ===');
    planColumnsResult.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkSchema();
