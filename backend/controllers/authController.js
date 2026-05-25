const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { pool } = require('../config/connectDB');
const logger = require('../utils/logger');
const { sendSMS } = require('../services/smsSend');
const { sendEmail } = require('../services/emailSend');

/**
 * Generate JWT token
 */
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};


const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }

  return false;
};


const serverError = (res, err, message = 'Internal server error') => {
  logger.error(err);
  return res.status(500).json({ error: message });
};


/**
 * =========================
 * REGISTER (RESIDENT SYSTEM)
 * =========================
 * Resident must already exist in DB
 */
const register = async (req, res) => {
  console.log("Received body:", req.body); 
  if (handleValidationErrors(req, res)) return;

  const {
    firstname,
    lastname,
    phone_number,
    email,
    password,
  } = req.body;

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Check resident exists in kebele records
    const [residents] = await connection.query(
      `SELECT *
       FROM residents
       WHERE firstname = ?
       AND lastname = ?
       AND phone_number = ?
       LIMIT 1`,
      [
        firstname.trim(),
        lastname.trim(),
        phone_number.trim(),
      ]
    );

    if (residents.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        error: 'Resident not found in kebele records',
      });
    }

    const resident = residents[0];

    // 2. Check if already registered
    if (resident.user_id) {
      // Check if the linked account is unverified — if so, resend OTP
      const [linkedUsers] = await connection.query(
        `SELECT id, email, is_active FROM users WHERE id = ? LIMIT 1`,
        [resident.user_id]
      );

      if (linkedUsers.length > 0 && !linkedUsers[0].is_active) {
        // Account exists but is NOT yet verified — regenerate OTP and resend
        const existingUser = linkedUsers[0];
        const newOtp = crypto.randomInt(100000, 999999).toString();
        const newOtpExpiry = new Date(Date.now() + 10 * 60000);

        await connection.query(
          `UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?`,
          [newOtp, newOtpExpiry, existingUser.id]
        );
        await connection.commit();
        connection.release();
        connection = null;

        const otpMsg = `Your Kebele System registration OTP is: ${newOtp}. It expires in 10 minutes.`;
        try {
          await sendEmail(existingUser.email, 'Kebele System Registration OTP', otpMsg);
          logger.info(`Resent OTP to unverified user: ${existingUser.email}`);
        } catch (emailErr) {
          logger.error(`Failed to resend OTP email to ${existingUser.email}: ${emailErr.message}`);
        }
        sendSMS(phone_number.trim(), otpMsg).catch(() => {});

        return res.status(200).json({
          message: 'An OTP has been resent to your email. Please verify to activate your account.',
          requires_otp: true,
          email: existingUser.email,
        });
      }

      // Account is fully active — they already have an account
      await connection.rollback();
      return res.status(400).json({
        error: 'Resident already has a verified account. Please login instead.',
      });
    }

    // 3. Check email already used by a different resident
    const [existingUser] = await connection.query(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      [email.trim().toLowerCase()]
    );

    if (existingUser.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        error: 'This email address is already in use. Please use a different email.',
      });
    }

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 5. Create user (always as resident)
    // Set is_active = FALSE initially, to be activated after OTP verification
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

    const [userResult] = await connection.query(
      `INSERT INTO users
      (email, password, role, is_active, otp_code, otp_expires_at)
      VALUES (?, ?, 'resident', FALSE, ?, ?)`,
      [
        email.trim().toLowerCase(),
        hashedPassword,
        otpCode,
        otpExpiresAt
      ]
    );

    const userId = userResult.insertId;

    // 6. Link resident to user
    await connection.query(
      `UPDATE residents
       SET user_id = ?
       WHERE id = ?`,
      [userId, resident.id]
    );

    await connection.commit();
    // DB is committed — release connection before sending notifications
    connection.release();
    connection = null;

    // Send OTP via Email (primary) and SMS (secondary, non-blocking)
    const otpMessage = `Your Kebele System registration OTP is: ${otpCode}. It expires in 10 minutes.`;
    let emailSent = false;
    try {
      await sendEmail(email.trim().toLowerCase(), 'Kebele System Registration OTP', otpMessage);
      emailSent = true;
      logger.info(`Registration OTP email sent to: ${email}`);
    } catch (emailErr) {
      logger.error(`Failed to send OTP email to ${email}: ${emailErr.message}`);
    }

    // SMS is fire-and-forget — never blocks registration
    sendSMS(phone_number.trim(), otpMessage).catch((smsErr) => {
      logger.error(`Failed to send OTP SMS to ${phone_number}: ${smsErr.message}`);
    });

    if (!emailSent) {
      logger.error(`CRITICAL: OTP email delivery failed for ${email}. OTP is stored in DB.`);
      return res.status(500).json({
        error: 'Registration saved but failed to send OTP email. Please contact support or try again.',
      });
    }

    logger.info(`Resident registered, awaiting OTP verification: ${email}`);

    return res.status(201).json({
      message: 'Registration successful. Please check your email for the OTP.',
      requires_otp: true,
      email: email.trim().toLowerCase(),
    });

  } catch (err) {
    if (connection) await connection.rollback();
    return serverError(res, err);

  } finally {
    if (connection) connection.release();
  }
};


/**
 * =========================
 * LOGIN
 * =========================
 */
const login = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const { email, password } = req.body;
  console.log(`[AUTH] Login attempt for: ${email}`);

  try {
    const [users] = await pool.query(
      `SELECT id, email, password, role, is_active
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      console.log(`[AUTH] Login failed: No user found with email ${email}`);
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log(`[AUTH] Login failed: Incorrect password for ${email}`);
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    if (!user.is_active) {
      console.log(`[AUTH] Login failed: Account is deactivated for ${email}`);
      return res.status(403).json({
        error: 'Account deactivated',
      });
    }

    const token = generateToken(user.id, user.role);
    console.log(`[AUTH] Login successful: ${email} (Role: ${user.role})`);

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      token,
    });

  } catch (err) {
    console.error(`[AUTH] Login error for ${email}:`, err);
    return serverError(res, err);
  }
};


/**
 * =========================
 * GET ME
 * =========================
 */
const getMe = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT id, email, role, is_active, created_at
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: users[0] });

  } catch (err) {
    return serverError(res, err);
  }
};



const verifyOTP = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const { email, otp } = req.body;

  try {
    const [users] = await pool.query(
      `SELECT id, email, role, otp_code, otp_expires_at, is_active
       FROM users WHERE email = ? LIMIT 1`,
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    if (user.is_active) {
      return res.status(400).json({ error: 'User is already verified and active' });
    }

    if (!user.otp_code || user.otp_code !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ error: 'OTP has expired' });
    }

    await pool.query(
      `UPDATE users SET is_active = TRUE, otp_code = NULL, otp_expires_at = NULL WHERE id = ?`,
      [user.id]
    );

    const token = generateToken(user.id, user.role);
    logger.info(`User verified OTP successfully: ${email}`);

    return res.status(200).json({
      message: 'OTP verified successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    return serverError(res, err);
  }
};


const forgotPassword = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const { identifier } = req.body; // can be email or phone

  try {
    // Find user by email or by resident phone number
    let query = `
      SELECT u.id, u.email, r.phone_number
      FROM users u
      LEFT JOIN residents r ON u.id = r.user_id
      WHERE u.email = ? OR r.phone_number = ?
      LIMIT 1
    `;
    const [users] = await pool.query(query, [identifier.trim().toLowerCase(), identifier.trim()]);

    if (users.length === 0) {
      // Don't leak whether user exists, just return success
      return res.status(200).json({ message: 'If the account exists, a reset code has been sent.' });
    }

    const user = users[0];
    const resetOTP = crypto.randomInt(100000, 999999).toString();
    const resetExpiresAt = new Date(Date.now() + 15 * 60000); // 15 mins

    await pool.query(
      `UPDATE users SET reset_token = ?, reset_token_expires_at = ? WHERE id = ?`,
      [resetOTP, resetExpiresAt, user.id]
    );

    const message = `Your password reset code is: ${resetOTP}. It expires in 15 minutes.`;
    await sendEmail(user.email, 'Kebele System Password Reset', message);
    if (user.phone_number) {
      await sendSMS(user.phone_number, message);
    }
    logger.info(`Forgot password OTP sent via Email/SMS for ${user.email}`);

    return res.status(200).json({ 
      message: 'If the account exists, a reset code has been sent.', 
      email: user.email,
      dev_otp: process.env.NODE_ENV !== 'production' ? resetOTP : undefined 
    });
  } catch (err) {
    return serverError(res, err);
  }
};


const resetPassword = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const { email, otp, newPassword } = req.body;

  try {
    const [users] = await pool.query(
      `SELECT id, reset_token, reset_token_expires_at FROM users WHERE email = ? LIMIT 1`,
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const user = users[0];

    if (!user.reset_token || user.reset_token !== otp) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    if (new Date() > new Date(user.reset_token_expires_at)) {
      return res.status(400).json({ error: 'Reset code has expired' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await pool.query(
      `UPDATE users SET password = ?, reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?`,
      [hashedPassword, user.id]
    );

    logger.info(`Password reset successfully for: ${email}`);

    return res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (err) {
    return serverError(res, err);
  }
};


const resendOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const [users] = await pool.query(
      `SELECT id, email, is_active FROM users WHERE email = ? LIMIT 1`,
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const user = users[0];

    if (user.is_active) {
      return res.status(400).json({ error: 'Account is already verified. Please login.' });
    }

    const newOtp = crypto.randomInt(100000, 999999).toString();
    const newOtpExpiry = new Date(Date.now() + 10 * 60000);

    await pool.query(
      `UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?`,
      [newOtp, newOtpExpiry, user.id]
    );

    const otpMsg = `Your Kebele System registration OTP is: ${newOtp}. It expires in 10 minutes.`;
    try {
      await sendEmail(user.email, 'Kebele System Registration OTP (Resent)', otpMsg);
      logger.info(`OTP resent to: ${user.email}`);
    } catch (emailErr) {
      logger.error(`Failed to resend OTP email to ${user.email}: ${emailErr.message}`);
      return res.status(500).json({ error: 'Failed to resend OTP. Please try again.' });
    }

    return res.status(200).json({
      message: 'A new OTP has been sent to your email.',
      email: user.email,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

module.exports = {
  register,
  login,
  getMe,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
};