const { pool } = require('../config/connectDB');
const logger = require('../utils/logger');

const serverError = (res, err, message = 'Internal server error') => {
  logger.error(err);
  return res.status(500).json({ error: message });
};

/**
 * GET /api/staff/profile
 */
const getStaffProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        ks.position, 
        ks.employee_id, 
        r.firstname, 
        r.lastname,
        u.email
       FROM kebele_staff ks
       JOIN users u ON ks.user_id = u.id
       JOIN residents r ON r.user_id = u.id
       WHERE ks.user_id = ?
       LIMIT 1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Staff profile not found' });
    }

    return res.status(200).json({ staff: rows[0] });

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * GET /api/staff/tasks
 */
const getMyTasks = async (req, res) => {
  try {
    const [tasks] = await pool.query(
      `SELECT
        t.id,
        t.title,
        t.description,
        t.task_type,
        t.status,
        t.due_date,
        t.completed_at,
        t.created_at,
        u.email AS assigned_by_email,
        r.firstname AS resident_firstname,
        r.lastname AS resident_lastname
       FROM tasks t
       INNER JOIN users u ON t.assigned_by = u.id
       LEFT JOIN residents r ON t.resident_id = r.id
       WHERE t.assigned_to = ?
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({ count: tasks.length, tasks });

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * GET /api/staff/tasks/:id
 */
const getSingleTask = async (req, res) => {
  const taskId = Number(req.params.id);

  if (!Number.isInteger(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID' });
  }

  try {
    const [tasks] = await pool.query(
      `SELECT 
        t.*,
        r.firstname AS resident_firstname,
        r.lastname AS resident_lastname,
        r.phone_number AS resident_phone
       FROM tasks t
       LEFT JOIN residents r ON t.resident_id = r.id
       WHERE t.id = ? AND t.assigned_to = ?
       LIMIT 1`,
      [taskId, req.user.id]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    return res.status(200).json(tasks[0]);

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * PUT /api/staff/tasks/:id/start
 */
const startTask = async (req, res) => {
  const taskId = Number(req.params.id);

  if (!Number.isInteger(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE tasks
       SET status = 'in_progress'
       WHERE id = ? AND assigned_to = ? AND status = 'pending'`,
      [taskId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found or already started' });
    }

    logger.info(`Staff ${req.user.id} started task ${taskId}`);
    return res.status(200).json({ message: 'Task started successfully' });

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * PUT /api/staff/tasks/:id/complete
 */
const completeTask = async (req, res) => {
  const taskId = Number(req.params.id);

  if (!Number.isInteger(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE tasks
       SET status = 'completed', completed_at = NOW()
       WHERE id = ? AND assigned_to = ? AND status = 'in_progress'`,
      [taskId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found or not in progress yet' });
    }

    logger.info(`Staff ${req.user.id} completed task ${taskId}`);
    return res.status(200).json({ message: 'Task completed successfully' });

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * GET /api/staff/tasks/type/:type
 */
const getTasksByType = async (req, res) => {
  const taskType = req.params.type;

  const allowedTypes = [
    'id_card', 'birth_certificate', 'death_certificate',
    'marriage_certificate', 'issue_report', 'other'
  ];

  if (!allowedTypes.includes(taskType)) {
    return res.status(400).json({ error: 'Invalid task type' });
  }

  try {
    const [tasks] = await pool.query(
      `SELECT 
        t.*,
        r.firstname AS resident_firstname,
        r.lastname AS resident_lastname
       FROM tasks t
       LEFT JOIN residents r ON t.resident_id = r.id
       WHERE t.assigned_to = ? AND t.task_type = ?
       ORDER BY t.created_at DESC`,
      [req.user.id, taskType]
    );

    return res.status(200).json({ count: tasks.length, tasks });

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * GET /api/staff/tasks/status/:status
 */
const getTasksByStatus = async (req, res) => {
  const status = req.params.status;

  const allowedStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid task status' });
  }

  try {
    const [tasks] = await pool.query(
      `SELECT 
        t.*,
        r.firstname AS resident_firstname,
        r.lastname AS resident_lastname
       FROM tasks t
       LEFT JOIN residents r ON t.resident_id = r.id
       WHERE t.assigned_to = ? AND t.status = ?
       ORDER BY t.created_at DESC`,
      [req.user.id, status]
    );

    return res.status(200).json({ count: tasks.length, tasks });

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * GET /api/staff/certificates
 * Returns certificates matching staff position
 */
const getCertificates = async (req, res) => {
  try {
    const [staffRows] = await pool.query(
      `SELECT position FROM kebele_staff WHERE user_id = ? LIMIT 1`,
      [req.user.id]
    );

    if (staffRows.length === 0) {
      return res.status(404).json({ error: 'Staff profile not found' });
    }

    const position = staffRows[0].position;

    const positionTypeMap = {
      birth_officer:    'birth',
      death_officer:    'death',
      marriage_officer: 'marriage',
    };

    const certType = positionTypeMap[position];

    if (!certType) {
      return res.status(200).json({ count: 0, certificates: [] });
    }

    const [certificates] = await pool.query(
      `SELECT 
        c.*,
        r.firstname AS resident_firstname,
        r.lastname AS resident_lastname,
        r.phone_number AS resident_phone
       FROM certificates c
       JOIN residents r ON c.resident_id = r.id
       WHERE c.certificate_type = ?
       AND c.status = 'pending'
       ORDER BY c.requested_at DESC`,
      [certType]
    );

    return res.status(200).json({ count: certificates.length, certificates });

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * PUT /api/staff/certificates/:id/prepare
 */
const prepareCertificate = async (req, res) => {
  const certId = Number(req.params.id);

  if (!Number.isInteger(certId)) {
    return res.status(400).json({ error: 'Invalid certificate ID' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE certificates
       SET status = 'in_review'
       WHERE id = ? AND status = 'pending'`,
      [certId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Certificate not found or already processed' });
    }

    logger.info(`Staff ${req.user.id} prepared certificate ${certId} for review`);
    return res.status(200).json({ message: 'Certificate prepared successfully' });

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * PUT /api/staff/certificates/:id/reject
 */
const rejectCertificate = async (req, res) => {
  const certId = Number(req.params.id);

  if (!Number.isInteger(certId)) {
    return res.status(400).json({ error: 'Invalid certificate ID' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE certificates
       SET status = 'rejected'
       WHERE id = ? AND status = 'pending'`,
      [certId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Certificate not found or already processed' });
    }

    logger.info(`Staff ${req.user.id} rejected certificate ${certId}`);
    return res.status(200).json({ message: 'Certificate rejected successfully' });

  } catch (err) {
    return serverError(res, err);
  }
};

module.exports = {
  getStaffProfile,
  getMyTasks,
  getSingleTask,
  startTask,
  completeTask,
  getTasksByType,
  getTasksByStatus,
  getCertificates,
  prepareCertificate,
  rejectCertificate,
};