const { Pool } = require('pg');

const isNeonDatabase = process.env.DB_HOST && process.env.DB_HOST.includes('neon.tech');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ruralbowl',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  // SSL required for Neon and other cloud databases
  ssl: isNeonDatabase ? { rejectUnauthorized: false } : false,
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

// Query helper with logging
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('Query executed:', { text: text.substring(0, 100), duration: `${duration}ms`, rows: result.rowCount });
    }
    return result;
  } catch (error) {
    console.error('Query error:', { text, error: error.message });
    throw error;
  }
};

module.exports = {
  pool,
  query,
  testConnection,
};
