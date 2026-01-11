const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const isNeonDatabase = process.env.DB_HOST && process.env.DB_HOST.includes('neon.tech');

const poolConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  // Production-ready pool settings
  max: parseInt(process.env.DB_POOL_MAX) || 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // SSL is required for Neon and other cloud databases
  ssl: (isProduction || isNeonDatabase) ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  if (!isProduction) {
    console.log('Connected to PostgreSQL database');
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
