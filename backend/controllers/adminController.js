const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { pool } = require('../config/connectDB');
const logger = require('../utils/logger');

/**
 * Helper: Handle validation errors
 */
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      errors: errors.array(),
    });
    return true;
  }

  return false;
};

/**
 * Helper: Generic server error response
 */
const serverError = (res, err, message = 'Internal server error') => {
  logger.error(err);
  return res.status(500).json({
    error: message,
  });
};

/**
 * POST /api/admin/users
 * Create admin or kebele staff account
 */
const createUser = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const {
    email,
    password,
    role,
    employee_id,
    position,
  } = req.body;

  const allowedRoles = ['admin', 'kebele_staff', 'resident'];

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      error: `Role must be one of: ${allowedRoles.join(', ')}`,
    });
  }

  let connection;

  try {
    connection = await pool.getConnection();

    await connection.beginTransaction();

    // Check existing email
    const [existingUser] = await connection.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (existingUser.length > 0) {
      await connection.rollback();

      return res.status(400).json({
        error: 'Email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const [userResult] = await connection.query(
      `INSERT INTO users 
      (email, password, role, is_active)
      VALUES (?, ?, ?, TRUE)`,
      [email.trim().toLowerCase(), hashedPassword, role]
    );

    const userId = userResult.insertId;

    // Assign kebele staff
    if (role === 'kebele_staff') {
      await connection.query(
        `INSERT INTO kebele_staff
        (user_id, employee_id, position)
        VALUES (?, ?, ?)`,
        [userId, employee_id || null, position || null]
      );
    }

    await connection.commit();

    logger.info(
      `Admin ${req.user.id} created user ${email} with role ${role}`
    );

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: userId,
        email,
        password,
        role,
      },
    });

  } catch (err) {
    if (connection) await connection.rollback();

    return serverError(res, err);

  } finally {
    if (connection) connection.release();
  }
};

/**
 * PUT /api/admin/users/:id/activate
 */
const activateUser = async (req, res) => {
  const userId = Number(req.params.id);

  if (!Number.isInteger(userId)) {
    return res.status(400).json({
      error: 'Invalid user ID',
    });
  }

  try {
    const [result] = await pool.query(
      `UPDATE users
       SET is_active = TRUE
       WHERE id = ?`,
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    logger.info(
      `Admin ${req.user.id} activated user ${userId}`
    );

    return res.status(200).json({
      message: 'User activated successfully',
    });

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * PUT /api/admin/users/:id/deactivate
 */
const deactivateUser = async (req, res) => {
  const userId = Number(req.params.id);

  if (!Number.isInteger(userId)) {
    return res.status(400).json({
      error: 'Invalid user ID',
    });
  }

  try {
    const [result] = await pool.query(
      `UPDATE users
       SET is_active = FALSE
       WHERE id = ?`,
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    logger.info(
      `Admin ${req.user.id} deactivated user ${userId}`
    );

    return res.status(200).json({
      message: 'User deactivated successfully',
    });

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * GET /api/admin/users
 * Optional query:
 * ?role=admin
 * ?page=1&limit=10
 */
const listUsers = async (req, res) => {
  try {
    const role = req.query.role || null;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        id,
        firstname,
        lastname,
        email,
        role,
        is_active,
        created_at
      FROM users
    `;

    const params = [];

    if (role) {
      query += ' WHERE role = ?';
      params.push(role);
    }

    query += `
      ORDER BY created_at DESC
      LIMIT ?
      OFFSET ?
    `;

    params.push(limit, offset);

    const [users] = await pool.query(query, params);

    return res.status(200).json({
      page,
      limit,
      count: users.length,
      users,
    });

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * PUT /api/admin/kebele/assign
 */
const assignKebeleStaff = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const {
    user_id,
    employee_id,
    position,
  } = req.body;

  try {
    const [existing] = await pool.query(
      `SELECT id
       FROM kebele_staff
       WHERE user_id = ?
       LIMIT 1`,
      [user_id]
    );

    if (existing.length > 0) {
      await pool.query(
        `UPDATE kebele_staff
         SET employee_id = ?, position = ?
         WHERE user_id = ?`,
        [employee_id || null, position || null, user_id]
      );

    } else {
      await pool.query(
        `INSERT INTO kebele_staff
        (user_id, employee_id, position)
        VALUES (?, ?, ?)`,
        [user_id, employee_id || null, position || null]
      );
    }

    logger.info(
      `Admin ${req.user.id} assigned user ${user_id} to kebele staff`
    );

    return res.status(200).json({
      message: 'Kebele assignment updated successfully',
    });

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * PUT /api/admin/certificates/:id/approve
 */
const approveCertificate = async (req, res) => {
  const certificateId = Number(req.params.id);

  if (!Number.isInteger(certificateId)) {
    return res.status(400).json({
      error: 'Invalid certificate ID',
    });
  }

  try {
    const [certificates] = await pool.query(
      `SELECT 
        id,
        status
      FROM certificates
      WHERE id = ?
      LIMIT 1`,
      [certificateId]
    );

    if (certificates.length === 0) {
      return res.status(404).json({
        error: 'Certificate not found',
      });
    }

    const certificate = certificates[0];

    if (certificate.status !== 'in_review') {
      return res.status(400).json({
        error: `Certificate status is '${certificate.status}', cannot approve`,
      });
    }

    await pool.query(
      `UPDATE certificates
       SET 
         status = 'approved',
         approved_by = ?,
         approved_at = NOW()
       WHERE id = ?`,
      [req.user.id, certificateId]
    );

    logger.info(
      `Admin ${req.user.id} approved certificate ${certificateId}`
    );

    return res.status(200).json({
      message: 'Certificate approved successfully',
    });

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * GET /api/admin/feedback
 */
const getFeedback = async (req, res) => {
  try {
    const [feedback] = await pool.query(`
      SELECT
        f.id,
        f.response,
        f.created_at,
        u.name AS resident_name,
        u.email AS resident_email
      FROM feedback f
      INNER JOIN residents r
        ON f.resident_id = r.id
      INNER JOIN users u
        ON r.user_id = u.id
      ORDER BY f.created_at DESC
    `);

    return res.status(200).json({
      count: feedback.length,
      feedback,
    });

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * POST /api/admin/feedback/:id/respond
 */
const respondToFeedback = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const feedbackId = Number(req.params.id);

  if (!Number.isInteger(feedbackId)) {
    return res.status(400).json({
      error: 'Invalid feedback ID',
    });
  }

  const { response } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE feedback
       SET
         response = ?,
         responded_at = NOW()
       WHERE id = ?`,
      [response, req.user.id, feedbackId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Feedback not found',
      });
    }

    logger.info(
      `Admin ${req.user.id} responded to feedback ${feedbackId}`
    );

    return res.status(200).json({
      message: 'Feedback response submitted successfully',
    });

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * GET /api/admin/staff
 */
const getStaffList = async (req, res) => {
  try {
    const positionFilter = req.query.position || null;

    let query = `
      SELECT 
        u.id AS user_id,
        u.email,
        u.role,
        u.is_active,
        u.created_at,
        ks.employee_id,
        ks.position
      FROM users u
      LEFT JOIN kebele_staff ks ON u.id = ks.user_id
      WHERE u.role = 'kebele_staff'
    `;

    const params = [];

    if (positionFilter) {
      query += ' AND ks.position = ?';
      params.push(positionFilter);
    }

    query += ' ORDER BY u.created_at DESC';

    const [staff] = await pool.query(query, params);

    return res.status(200).json({
      count: staff.length,
      staff,
    });

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * GET /api/admin/certificates
 * Get certificates with status 'in_review'
 */
const getCertificates = async (req, res) => {
  try {
    const [certificates] = await pool.query(
      `SELECT 
        c.*,
        r.firstname AS resident_firstname,
        r.lastname AS resident_lastname,
        r.phone_number AS resident_phone
       FROM certificates c
       INNER JOIN residents r ON c.resident_id = r.id
       WHERE c.status = 'in_review'
       ORDER BY c.requested_at DESC`
    );

    return res.status(200).json({
      count: certificates.length,
      certificates,
    });

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * PUT /api/admin/certificates/:id/reject
 */
const rejectCertificate = async (req, res) => {
  const certificateId = Number(req.params.id);

  if (!Number.isInteger(certificateId)) {
    return res.status(400).json({
      error: 'Invalid certificate ID',
    });
  }

  try {
    const [certificates] = await pool.query(
      `SELECT 
        id,
        status
      FROM certificates
      WHERE id = ?
      LIMIT 1`,
      [certificateId]
    );

    if (certificates.length === 0) {
      return res.status(404).json({
        error: 'Certificate not found',
      });
    }

    const certificate = certificates[0];

    if (certificate.status !== 'in_review') {
      return res.status(400).json({
        error: `Certificate status is '${certificate.status}', cannot reject`,
      });
    }

    await pool.query(
      `UPDATE certificates
       SET 
         status = 'rejected',
         approved_by = ?,
         approved_at = NOW()
       WHERE id = ?`,
      [req.user.id, certificateId]
    );

    logger.info(
      `Admin ${req.user.id} rejected certificate ${certificateId}`
    );

    return res.status(200).json({
      message: 'Certificate rejected successfully',
    });

  } catch (err) {
    return serverError(res, err);
  }
};

module.exports = {
  createUser,
  activateUser,
  deactivateUser,
  listUsers,
  getStaffList,
  assignKebeleStaff,
  approveCertificate,
  getCertificates,
  rejectCertificate,
};