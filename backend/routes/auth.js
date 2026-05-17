const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const {
  register,
  login,
  getMe
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');


/**
 * ======================
 * REGISTER (RESIDENT ONLY)
 * ======================
 * Public route
 */
router.post(
  '/register',
  authLimiter,
  [
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
 * LOGIN (ALL ROLES)
 * ======================
 * Public route
 */
router.post(
  '/login',
  authLimiter,
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