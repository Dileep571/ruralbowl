const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function createOTPTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_otp (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(6) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        attempts INTEGER DEFAULT 0
      )
    `);
    
    console.log('✅ Created email_otp table');
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_email_otp_email ON email_otp(email)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_email_otp_expires ON email_otp(expires_at)
    `);
    
    console.log('✅ Created indexes');
    
    // Clean up old OTPs
    await pool.query(`
      DELETE FROM email_otp WHERE expires_at < NOW() - INTERVAL '1 hour'
    `);
    
    console.log('✅ OTP table setup complete!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

createOTPTable();
