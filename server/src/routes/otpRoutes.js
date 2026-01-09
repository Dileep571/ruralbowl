const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { sendOTP, verifyOTP, resendOTP } = require('../controllers/otpController');
const { otpLimiter } = require('../middleware/rateLimiter');

// Validation rules
const otpValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail()
];

const verifyOTPValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .isNumeric().withMessage('OTP must be numeric')
];

// @route   POST /api/otp/send
// @desc    Send OTP to email for verification
// @access  Public
router.post('/send', otpLimiter, otpValidation, sendOTP);

// @route   POST /api/otp/verify
// @desc    Verify OTP code
// @access  Public
router.post('/verify', verifyOTPValidation, verifyOTP);

// @route   POST /api/otp/resend
// @desc    Resend OTP to email
// @access  Public
router.post('/resend', otpValidation, resendOTP);

module.exports = router;
