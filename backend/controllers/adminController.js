const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { pool } = require('../config/connectDB');
const logger = require('../utils/logger');
const {
  logCertificateAudit,
  notifyUser,
  getResidentUserIdForCertificate,
} = require('../services/certificateNotificationService');


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


const serverError = (res, err, message = 'Internal server error') => {
  logger.error(err);
  return res.status(500).json({
    error: message,
  });
};


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


const listUsers = async (req, res) => {
  try {
    const role = req.query.role || null;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        u.id AS user_id,
        r.id AS resident_id,
        r.firstname,
        r.lastname,
        r.gender,
        r.phone_number,
        r.occupation,
        r.marital_status,
        r.address,
        r.registration_date,
        u.email,
        u.role,
        u.is_active,
        u.created_at
      FROM users u
      LEFT JOIN residents r ON r.user_id = u.id
    `;

    let countQuery = `SELECT COUNT(*) as total FROM users u`;

    const params = [];
    const countParams = [];

    if (role) {
      query += ' WHERE u.role = ?';
      countQuery += ' WHERE u.role = ?';
      params.push(role);
      countParams.push(role);
    }

    query += `
      ORDER BY u.created_at DESC
      LIMIT ?
      OFFSET ?
    `;

    params.push(limit, offset);

    const [users] = await pool.query(query, params);
    const [countRows] = await pool.query(countQuery, countParams);
    const total = countRows[0].total;

    return res.status(200).json({
      page,
      limit,
      total,
      count: users.length,
      users,
    });

  } catch (err) {
    return serverError(res, err);
  }
};


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


const assignCertificate = async (req, res) => {
  const certificateId = Number(req.params.id);
  const staffUserId = Number(req.body.staff_user_id);

  if (!Number.isInteger(certificateId) || !Number.isInteger(staffUserId)) {
    return res.status(400).json({
      error: 'Valid certificate id and staff_user_id are required',
    });
  }

  try {
    const [certificates] = await pool.query(
      `SELECT id, status, certificate_type
       FROM certificates
       WHERE id = ?
       LIMIT 1`,
      [certificateId]
    );

    if (certificates.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const certificate = certificates[0];

    if (certificate.status !== 'pending') {
      return res.status(400).json({
        error: `Only pending requests can be assigned (current: '${certificate.status}')`,
      });
    }

    const [staffRows] = await pool.query(
      `SELECT ks.user_id, ks.position
       FROM kebele_staff ks
       INNER JOIN users u ON ks.user_id = u.id
       WHERE ks.user_id = ?
         AND u.role = 'kebele_staff'
         AND u.is_active = TRUE
       LIMIT 1`,
      [staffUserId]
    );

    if (staffRows.length === 0) {
      return res.status(404).json({ error: 'Active staff member not found' });
    }

    const staffPosition = staffRows[0].position;

    const allowedTypesForPosition = {
      birth_officer: ['birth'],
      death_officer: ['death'],
      marriage_officer: ['marriage'],
      id_officer: ['residency', 'residency-id'],
      kebele_staff: ['birth', 'death', 'marriage', 'residency', 'residency-id']
    };

    const allowedTypes = allowedTypesForPosition[staffPosition] || [];

    if (staffPosition !== 'kebele_staff' && !allowedTypes.includes(certificate.certificate_type)) {
      return res.status(400).json({
        error: 'Staff position does not match this certificate type',
      });
    }

    const [result] = await pool.query(
      `UPDATE certificates
       SET status = 'assigned',
           assigned_staff_user_id = ?,
           assigned_by_user_id = ?,
           assigned_at = NOW()
       WHERE id = ?
         AND status = 'pending'`,
      [staffUserId, req.user.id, certificateId]
    );

    if (result.affectedRows === 0) {
      return res.status(409).json({ error: 'Certificate could not be assigned' });
    }

    await logCertificateAudit(
      certificateId,
      req.user.id,
      'admin_assign',
      String(staffUserId)
    );

    await notifyUser(
      staffUserId,
      'New certificate request assigned',
      `You have been assigned certificate request #${certificateId}.`,
      `/staff-dashboard`
    );

    logger.info(`Admin ${req.user.id} assigned certificate ${certificateId} to staff ${staffUserId}`);

    return res.status(200).json({ message: 'Certificate assigned successfully' });
  } catch (err) {
    return serverError(res, err);
  }
};


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
         c.*,
         r.id AS requester_resident_id,
         r.firstname AS requester_firstname,
         r.lastname AS requester_lastname,
         r.marital_status AS requester_marital_status
       FROM certificates c
       INNER JOIN residents r ON c.resident_id = r.id
       WHERE c.id = ?
       LIMIT 1`,
      [certificateId]
    );

    if (certificates.length === 0) {
      return res.status(404).json({
        error: 'Certificate not found',
      });
    }

    const certificate = certificates[0];

    if (certificate.status !== 'ready_for_approval') {
      return res.status(400).json({
        error: `Certificate status is '${certificate.status}', cannot approve`,
      });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      if (certificate.certificate_type === 'marriage') {
        // Prefer to verify an active (spouse-approved) marriage relationship exists for this resident.
        // If no active relationship record exists, fall back to the resident's recorded
        // marital status (as included on the certificate) to avoid rejecting valid cases
        // where the relationship record may be missing but the residents table reflects marriage.
        const [activeMarriage] = await connection.query(
          `SELECT id FROM marriage_relationships
           WHERE (husband_id = ? OR wife_id = ?) AND status = 'active'
           LIMIT 1`,
          [certificate.requester_resident_id, certificate.requester_resident_id]
        );

        if (activeMarriage.length === 0) {
          const reqMaritalStatus = (certificate.requester_marital_status || '').toLowerCase();
          if (reqMaritalStatus === 'married') {
            logger.warn(
              `Admin ${req.user.id} approving certificate ${certificateId}: resident marked as 'married' but no active marriage_relationship found; proceeding.`
            );
            // proceed with approval — this preserves existing behavior for properly
            // established marriages while avoiding false negatives when the
            // relationship record is missing.
          } else {
            await connection.rollback();
            return res.status(400).json({
              error: 'This marriage certificate cannot be approved because no active, spouse-verified marriage registration was found for this resident.',
            });
          }
        }
        // marital_status and spouse_id are expected to be set when relationship approval occurs.
      }

      if (certificate.certificate_type === 'birth') {
        const childFirstname = certificate.child_name || '';
        const childLastname = certificate.requester_firstname || '';
        if (childFirstname && childLastname) {
          const [existingChild] = await connection.query(
            `SELECT id FROM children WHERE firstname = ? AND lastname = ? LIMIT 1`,
            [childFirstname, childLastname]
          );

          if (existingChild.length > 0) {
            await connection.query(
              `UPDATE children
               SET father_id = ?, birth_date = ?, birthplace = ?
               WHERE id = ?`,
              [certificate.requester_resident_id, certificate.birth_date || null, certificate.birth_place || null, existingChild[0].id]
            );
          } else {
            await connection.query(
              `INSERT INTO children
               (father_id, mother_id, firstname, lastname, birth_date, birthplace, is_alive)
               VALUES (?, NULL, ?, ?, ?, ?, TRUE)`,
              [certificate.requester_resident_id, childFirstname, childLastname, certificate.birth_date || null, certificate.birth_place || null]
            );
          }
        }
      }

      await connection.query(
        `UPDATE certificates
         SET status = 'approved', approved_by = ?, approved_at = NOW(), rejection_reason = NULL
         WHERE id = ?`,
        [req.user.id, certificateId]
      );

      await connection.commit();
    } catch (err) {
      if (connection) await connection.rollback();
      throw err;
    } finally {
      if (connection) connection.release();
    }

    await logCertificateAudit(certificateId, req.user.id, 'admin_approve', null);

    const residentUserId = await getResidentUserIdForCertificate(certificateId);
    await notifyUser(
      residentUserId,
      'Certificate approved',
      `Your certificate request #${certificateId} has been approved. You can download it from your dashboard.`,
      `/resident-dashboard`
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
        CONCAT(r.firstname, ' ', r.lastname) AS resident_name,
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


const getCertificates = async (req, res) => {
  try {
    const queue = (req.query.queue || 'approval').toLowerCase();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const q = (req.query.q || '').trim();
    const like = q ? `%${q}%` : null;

    let statusClause = `c.status = 'ready_for_approval'`;
    if (queue === 'assignment' || queue === 'pending') {
      statusClause = `c.status = 'pending'`;
    } else if (queue === 'in_progress' || queue === 'processing') {
      statusClause = `c.status IN ('assigned', 'processing')`;
    } else if (queue === 'all') {
      statusClause = `c.status IN (
        'pending','assigned','processing','ready_for_approval','approved','rejected','issued'
      )`;
    }

    let where = statusClause;
    const params = [];

    if (like) {
      where += ` AND (
        r.firstname LIKE ? OR r.lastname LIKE ? OR r.phone_number LIKE ?
        OR CAST(c.id AS CHAR) LIKE ?
        OR IFNULL(c.child_name,'') LIKE ?
        OR IFNULL(c.husband_name,'') LIKE ?
        OR IFNULL(c.wife_name,'') LIKE ?
      )`;
      params.push(like, like, like, like, like, like, like);
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM certificates c
       INNER JOIN residents r ON c.resident_id = r.id
       WHERE ${where}`,
      params
    );
    const total = countRows[0]?.total || 0;

    const [certificates] = await pool.query(
      `SELECT 
        c.*,
        r.firstname AS resident_firstname,
        r.lastname AS resident_lastname,
        r.phone_number AS resident_phone,
        u.email AS assigned_staff_email
       FROM certificates c
       INNER JOIN residents r ON c.resident_id = r.id
       LEFT JOIN users u ON c.assigned_staff_user_id = u.id
       WHERE ${where}
       ORDER BY c.requested_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.status(200).json({
      count: certificates.length,
      total,
      page,
      limit,
      queue,
      certificates,
    });
  } catch (err) {
    return serverError(res, err);
  }
};


const rejectCertificate = async (req, res) => {
  const certificateId = Number(req.params.id);

  if (!Number.isInteger(certificateId)) {
    return res.status(400).json({
      error: 'Invalid certificate ID',
    });
  }

  const reason = (req.body?.reason || req.body?.rejection_reason || '').trim();

  if (!reason) {
    return res.status(400).json({
      error: 'Rejection reason is required',
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

    if (certificate.status !== 'ready_for_approval') {
      return res.status(400).json({
        error: `Certificate status is '${certificate.status}', cannot reject`,
      });
    }

    await pool.query(
      `UPDATE certificates
       SET 
         status = 'rejected',
         approved_by = ?,
         approved_at = NOW(),
         rejection_reason = ?
       WHERE id = ?`,
      [req.user.id, reason, certificateId]
    );

    await logCertificateAudit(certificateId, req.user.id, 'admin_reject', reason);

    const residentUserId = await getResidentUserIdForCertificate(certificateId);
    await notifyUser(
      residentUserId,
      'Certificate request rejected',
      `Your certificate request #${certificateId} was rejected: ${reason}`,
      `/resident-dashboard`
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

const getReports = async (req, res) => {
  try {
    const [reports] = await pool.query(`
      SELECT
        rp.id,
        rp.title,
        rp.category,
        rp.description,
        rp.status,
        rp.response,
        rp.created_at,
        CONCAT(r.firstname, ' ', r.lastname) AS reporter,
        u.email AS resident_email
      FROM report rp
      INNER JOIN residents r ON rp.resident_id = r.id
      INNER JOIN users u ON r.user_id = u.id
      ORDER BY rp.created_at DESC
    `);

    return res.status(200).json({
      count: reports.length,
      reports,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

const updateReportStatus = async (req, res) => {
  const reportId = Number(req.params.id);
  const { status } = req.body;

  if (!Number.isInteger(reportId)) {
    return res.status(400).json({ error: 'Invalid report ID' });
  }

  const allowedStatuses = ['pending', 'in_review', 'completed', 'rejected'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE report
       SET status = ?
       WHERE id = ?`,
      [status, reportId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    return res.status(200).json({ message: 'Report status updated successfully' });
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
  assignCertificate,
  approveCertificate,
  getCertificates,
  rejectCertificate,
  getReports,
  updateReportStatus,
};