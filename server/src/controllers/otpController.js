const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const emailService = require('../services/emailService');

// Generate 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send OTP for email verification
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    const normalizedEmail = email.trim().toLowerCase();
    
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if user already exists
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Check for recent OTP request (rate limiting - 1 minute)
    const recentOTP = await db.query(
      'SELECT * FROM email_otp WHERE email = $1 AND created_at > NOW() - INTERVAL \'1 minute\' ORDER BY created_at DESC LIMIT 1',
      [normalizedEmail]
    );

    if (recentOTP.rows.length > 0) {
      const waitTime = Math.ceil((60 - (Date.now() - new Date(recentOTP.rows[0].created_at).getTime()) / 1000));
      return res.status(429).json({ 
        message: `Please wait ${waitTime} seconds before requesting a new OTP`,
        waitTime 
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash OTP before storing (security best practice)
    const hashedOTP = await bcrypt.hash(otp, 10);

    // Delete old OTPs for this email
    await db.query('DELETE FROM email_otp WHERE email = $1', [normalizedEmail]);

    // Store hashed OTP in database
    await db.query(
      'INSERT INTO email_otp (email, otp_code, expires_at) VALUES ($1, $2, $3)',
      [normalizedEmail, hashedOTP, expiresAt]
    );

    // Send OTP email
    const emailResult = await emailService.sendOTPEmail(normalizedEmail, otp);

    if (!emailResult.success) {
      console.error('Failed to send OTP email:', emailResult.error);
      return res.status(500).json({ message: 'Failed to send OTP email. Please try again.' });
    }

    console.log(`✅ OTP sent to ${normalizedEmail}: ${otp}`); // Log for development
    
    res.status(200).json({ 
      message: 'OTP sent successfully to your email',
      expiresIn: 600 // seconds
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find OTP record
    const result = await db.query(
      'SELECT * FROM email_otp WHERE email = $1 AND verified = false ORDER BY created_at DESC LIMIT 1',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    }

    const otpRecord = result.rows[0];

    // Check if OTP expired
    if (new Date() > new Date(otpRecord.expires_at)) {
      await db.query('DELETE FROM email_otp WHERE id = $1', [otpRecord.id]);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Check attempts (max 5)
    if (otpRecord.attempts >= 5) {
      await db.query('DELETE FROM email_otp WHERE id = $1', [otpRecord.id]);
      return res.status(400).json({ message: 'Too many failed attempts. Please request a new OTP.' });
    }

    // Verify OTP using bcrypt compare (since OTP is hashed)
    const isValidOTP = await bcrypt.compare(otp.trim(), otpRecord.otp_code);
    
    if (!isValidOTP) {
      // Increment attempts
      await db.query(
        'UPDATE email_otp SET attempts = attempts + 1 WHERE id = $1',
        [otpRecord.id]
      );
      const remainingAttempts = 5 - (otpRecord.attempts + 1);
      return res.status(400).json({ 
        message: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
        remainingAttempts
      });
    }

    // Mark as verified
    await db.query(
      'UPDATE email_otp SET verified = true WHERE id = $1',
      [otpRecord.id]
    );

    res.status(200).json({ 
      message: 'Email verified successfully',
      verified: true 
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Resend OTP (same as sendOTP but with different messaging)
const resendOTP = async (req, res) => {
  return sendOTP(req, res);
};

module.exports = {
  sendOTP,
  verifyOTP,
  resendOTP
};
