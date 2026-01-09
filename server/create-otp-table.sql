-- Create OTP verification table for email verification during signup
CREATE TABLE IF NOT EXISTS email_otp (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  CONSTRAINT unique_unverified_email UNIQUE (email, verified)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_otp_email ON email_otp(email);
CREATE INDEX IF NOT EXISTS idx_email_otp_expires ON email_otp(expires_at);

-- Clean up expired OTPs (older than 1 hour)
DELETE FROM email_otp WHERE expires_at < NOW() - INTERVAL '1 hour';
