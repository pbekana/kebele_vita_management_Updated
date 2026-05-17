const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { pool } = require('../config/connectDB');
const logger = require('../utils/logger');

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

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }

  return false;
};

/**
 * Server error handler
 */
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
      await connection.rollback();
      return res.status(400).json({
        error: 'Resident already has an account',
      });
    }

    // 3. Check email already used
    const [existingUser] = await connection.query(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      [email.trim().toLowerCase()]
    );

    if (existingUser.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        error: 'Email already registered',
      });
    }

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 5. Create user (always as resident)
    const [userResult] = await connection.query(
      `INSERT INTO users
      (email, password, role, is_active)
      VALUES (?, ?, 'resident', TRUE)`,
      [
        email.trim().toLowerCase(),
        hashedPassword,
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

   const token = generateToken(userId, 'resident');

    logger.info(`Resident registered: ${email}`);

    return res.status(201).json({
      message: 'Registration successful',
      user: {
        id: userId,
        email,
        role: 'resident',
      },
      token,
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


module.exports = {
  register,
  login,
  getMe,
};