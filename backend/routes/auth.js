const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const {
  register,
  login,
  getMe,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');


/**
 * ======================
 * REGISTER (RESIDENT ONLY)
 * ======================
 * Public route
 */
router.post(
  '/register',
  [
    body('firstname')
      .trim()
      .notEmpty()
      .withMessage('First name is required')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('First name cannot contain numbers or special characters'),

    body('lastname')
      .trim()
      .notEmpty()
      .withMessage('Last name is required')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Last name cannot contain numbers or special characters'),

    body('email')
      .isEmail()
      .withMessage('Valid email required'),

    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],
  register
);

/**
 * ======================
 * VERIFY OTP
 * ======================
 * Public route
 */
router.post(
  '/verify-otp',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('otp').notEmpty().withMessage('OTP is required')
  ],
  verifyOTP
);

/**
 * ======================
 * RESEND OTP
 * ======================
 * Public route — for users stuck on OTP step
 */
router.post(
  '/resend-otp',
  [
    body('email').isEmail().withMessage('Valid email required')
  ],
  resendOTP
);

/**
 * ======================
 * FORGOT PASSWORD
 * ======================
 * Public route
 */
router.post(
  '/forgot-password',
  [
    body('identifier').notEmpty().withMessage('Email or phone number is required')
  ],
  forgotPassword
);

/**
 * ======================
 * RESET PASSWORD
 * ======================
 * Public route
 */
router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('otp').notEmpty().withMessage('Reset code is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  resetPassword
);

/**
 * ======================
 * LOGIN (ALL ROLES)
 * ======================
 * Public route
 */
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Valid email required'),

    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  login
);


/**
 * ======================
 * GET CURRENT USER
 * ======================
 * Protected route
 */
router.get('/me', protect, getMe);


module.exports = router;