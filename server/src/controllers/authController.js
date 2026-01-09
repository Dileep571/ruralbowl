const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const { validationResult } = require('express-validator');
const emailService = require('../services/emailService');

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Generate secure random refresh token
const generateRefreshTokenString = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Hash token for storage (using SHA256)
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Save refresh token to DB (stores hashed version)
const saveRefreshToken = async (userId, token, expiresAt) => {
  const hashedToken = hashToken(token);
  await db.query(
    'INSERT INTO refresh_tokens(token, user_id, expires_at) VALUES ($1, $2, $3) ON CONFLICT (token) DO UPDATE SET revoked = false, expires_at = $3',
    [hashedToken, userId, expiresAt]
  );
};

// Revoke refresh token (by hashed value)
const revokeRefreshToken = async (token) => {
  const hashedToken = hashToken(token);
  await db.query('UPDATE refresh_tokens SET revoked = true WHERE token = $1', [hashedToken]);
};

// Find refresh token record (by hashed value)
const findRefreshToken = async (token) => {
  const hashedToken = hashToken(token);
  const result = await db.query('SELECT * FROM refresh_tokens WHERE token = $1', [hashedToken]);
  return result.rows[0];
};

// Register User
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let { name, email, password, phone, address } = req.body;
    
    // Normalize email (trim and lowercase)
    email = email.trim().toLowerCase();
    
    // Additional email validation
    const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // Check email length constraints
    if (email.length > 254) {
      return res.status(400).json({ message: 'Email address is too long' });
    }
    
    const [localPart, domain] = email.split('@');
    if (localPart.length > 64) {
      return res.status(400).json({ message: 'Email address is invalid' });
    }
    
    // Check for invalid characters and patterns
    if (email.includes('..') || localPart.startsWith('.') || localPart.endsWith('.')) {
      return res.status(400).json({ message: 'Email address contains invalid characters' });
    }

    // Check if user already exists
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email address' });
    }
    
    // Check if email is verified via OTP
    const otpVerified = await db.query(
      'SELECT * FROM email_otp WHERE email = $1 AND verified = true ORDER BY created_at DESC LIMIT 1',
      [email]
    );
    
    if (otpVerified.rows.length === 0) {
      return res.status(400).json({ message: 'Email not verified. Please verify your email first.' });
    }
    
    // Check if OTP verification is still valid (within 1 hour)
    const otpRecord = otpVerified.rows[0];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (new Date(otpRecord.created_at) < oneHourAgo) {
      await db.query('DELETE FROM email_otp WHERE id = $1', [otpRecord.id]);
      return res.status(400).json({ message: 'Email verification expired. Please verify again.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await db.query(
      'INSERT INTO users (name, email, password, phone, address) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone, address, role, created_at',
      [name, email, hashedPassword, phone, address]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    // Create refresh token and set as httpOnly cookie
    const refreshToken = generateRefreshTokenString();
    const refreshExpiryDays = parseInt(process.env.REFRESH_TOKEN_EXPIRE_DAYS || '30', 10);
    const expiresAt = new Date(Date.now() + refreshExpiryDays * 24 * 60 * 60 * 1000);
    await saveRefreshToken(user.id, refreshToken, expiresAt);

    // Set access token cookie (10-15 minutes)
    const accessTokenExpiry = parseInt(process.env.ACCESS_TOKEN_COOKIE_MINUTES || '15', 10);
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: accessTokenExpiry * 60 * 1000,
      path: '/'
    });

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshExpiryDays * 24 * 60 * 60 * 1000,
      path: '/auth/refresh'
    });

    // Send response immediately (NO TOKEN IN BODY)
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });

    // Send welcome email asynchronously AFTER response is sent
    setImmediate(() => {
      emailService.sendWelcomeEmail(user.email, user)
        .then(() => {
          console.log('\u2705 Welcome email sent to:', user.email);
        })
        .catch((emailError) => {
          console.error('\u26a0\ufe0f Failed to send welcome email:', emailError.message);
          console.error('Email error details:', emailError);
        });
    });
  } catch (error) {
    console.error('Register error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login User
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    // Generate and save refresh token
    const refreshToken = generateRefreshTokenString();
    const refreshExpiryDays = parseInt(process.env.REFRESH_TOKEN_EXPIRE_DAYS || '30', 10);
    const expiresAt = new Date(Date.now() + refreshExpiryDays * 24 * 60 * 60 * 1000);
    await saveRefreshToken(user.id, refreshToken, expiresAt);

    // Set access token cookie (10-15 minutes)
    const accessTokenExpiry = parseInt(process.env.ACCESS_TOKEN_COOKIE_MINUTES || '15', 10);
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: accessTokenExpiry * 60 * 1000,
      path: '/'
    });

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshExpiryDays * 24 * 60 * 60 * 1000,
      path: '/auth/refresh'
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Refresh access token using refresh token cookie
const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token missing' });
    }

    const record = await findRefreshToken(refreshToken);
    if (!record || record.revoked) {
      return res.status(401).json({ message: 'Refresh token invalid' });
    }

    const now = new Date();
    if (new Date(record.expires_at) < now) {
      return res.status(401).json({ message: 'Refresh token expired' });
    }

    // Load user
    const userRes = await db.query('SELECT id, email, role FROM users WHERE id = $1', [record.user_id]);
    if (!userRes.rows[0]) return res.status(404).json({ message: 'User not found' });

    const user = userRes.rows[0];
    const accessToken = generateToken(user);

    // Rotate refresh token: generate new one and revoke old
    const newRefreshToken = generateRefreshTokenString();
    const refreshExpiryDays = parseInt(process.env.REFRESH_TOKEN_EXPIRE_DAYS || '30', 10);
    const expiresAt = new Date(Date.now() + refreshExpiryDays * 24 * 60 * 60 * 1000);
    await saveRefreshToken(user.id, newRefreshToken, expiresAt);
    await revokeRefreshToken(refreshToken);

    // Set new access token cookie (10-15 minutes)
    const accessTokenExpiry = parseInt(process.env.ACCESS_TOKEN_COOKIE_MINUTES || '15', 10);
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: accessTokenExpiry * 60 * 1000,
      path: '/'
    });

    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshExpiryDays * 24 * 60 * 60 * 1000,
      path: '/auth/refresh'
    });

    res.json({ success: true, message: 'Token refreshed' });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Logout - revoke refresh token
const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    // Clear both cookies
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/auth/refresh' });
    res.json({ success: true, message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Current User
const getMe = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, phone, address, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update User Profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const userId = req.user.id;

    const result = await db.query(
      'UPDATE users SET name = $1, phone = $2, address = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, name, email, phone, address, role',
      [name, phone, address, userId]
    );

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Request Password Reset
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      // Return success even if user doesn't exist (security best practice)
      return res.json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }

    const user = userResult.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token to database
    await db.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3, used = false',
      [user.id, hashedToken, expiresAt]
    );

    // Send reset email (don't await to avoid blocking)
    emailService.sendPasswordReset(user.email, user, resetToken)
      .catch(err => console.error('Password reset email error:', err));

    res.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Hash the token to find it in database
    const hashedToken = hashToken(token);

    // Find valid reset token
    const tokenResult = await db.query(
      'SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW() AND used = false',
      [hashedToken]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const resetRecord = tokenResult.rows[0];

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user password
    await db.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, resetRecord.user_id]
    );

    // Mark token as used
    await db.query(
      'UPDATE password_reset_tokens SET used = true WHERE id = $1',
      [resetRecord.id]
    );

    res.json({ message: 'Password reset successfully. You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
};
