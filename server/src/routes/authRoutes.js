const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, refreshAccessToken, logout, getMe, updateProfile } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerValidation, register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, login);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authMiddleware, getMe);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, updateProfile);

// @route   POST /api/auth/refresh
// @desc    Refresh access token using refresh token cookie
// @access  Public (uses httpOnly cookie)
router.post('/refresh', refreshAccessToken);

// @route   POST /api/auth/logout
// @desc    Logout and revoke refresh token
// @access  Public
router.post('/logout', logout);

module.exports = router;
