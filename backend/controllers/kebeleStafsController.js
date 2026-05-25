const { pool } = require('../config/connectDB');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');
const { generateCertificate } = require('../utils/pdfGenerator');
const {
  logCertificateAudit,
  notifyUser,
  notifyUsers,
  getAdminUserIds,
  getResidentUserIdForCertificate,
} = require('../services/certificateNotificationService');

const CERT_UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'certificates');

const serverError = (res, err, message = 'Internal server error') => {
  logger.error(err);
  return res.status(500).json({ error: message });
};

async function loadAssignedCertificate(certId, staffUserId) {
  const [rows] = await pool.query(
    `SELECT
      c.*,
      r.firstname AS resident_firstname,
      r.lastname AS resident_lastname
     FROM certificates c
     JOIN residents r ON c.resident_id = r.id
     WHERE c.id = ? AND c.assigned_staff_user_id = ?
     LIMIT 1`,
    [certId, staffUserId]
  );
  return rows[0] || null;
}

async function writeGeneratedPdf(cert, residentFullName) {
  await fs.promises.mkdir(CERT_UPLOAD_DIR, { recursive: true });
  const absPath = path.join(CERT_UPLOAD_DIR, `cert_${cert.id}_${Date.now()}.pdf`);

  await new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(absPath);
    stream.on('finish', resolve);
    stream.on('error', reject);
    generateCertificate(
      {
        ...cert,
        resident_name: residentFullName,
        issue_date: cert.issue_date || new Date(),
      },
      stream
    );
  });

  return absPath;
}

async function ensureCertificatePdf(cert) {
  const residentName = `${cert.resident_firstname || ''} ${cert.resident_lastname || ''}`.trim()
    || 'Resident';

  if (cert.pdf_url) {
    try {
      await fs.promises.access(cert.pdf_url);
      return cert.pdf_url;
    } catch {
      logger.warn(`Missing PDF file for certificate ${cert.id}, regenerating`);
    }
  }

  const absPath = await writeGeneratedPdf(cert, residentName);
  await pool.query(`UPDATE certificates SET pdf_url = ? WHERE id = ?`, [absPath, cert.id]);
  return absPath;
}

async function notifyAdminsCertificateReady(certId) {
  const admins = await getAdminUserIds();
  await notifyUsers(
    admins,
    'Certificate ready for approval',
    `Certificate request #${certId} is ready for your review.`,
    `/admin-dashboard`
  );
}


const getStaffProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        ks.position, 
        ks.employee_id, 
        COALESCE(r.firstname, SUBSTRING_INDEX(u.email, '@', 1)) AS firstname,
        COALESCE(r.lastname, '') AS lastname,
        u.email
       FROM kebele_staff ks
       JOIN users u ON ks.user_id = u.id
       LEFT JOIN residents r ON r.user_id = u.id
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

const positionTypeMap = {
  birth_officer: 'birth',
  death_officer: 'death',
  marriage_officer: 'marriage',
};

const staffCertType = (position) => positionTypeMap[position] || null;


const getCertificates = async (req, res) => {
  console.log("STAFF USER:", req.user);
  try {
    const [staffRows] = await pool.query(
      `SELECT position FROM kebele_staff WHERE user_id = ? LIMIT 1`,
      [req.user.id]
    );

    if (staffRows.length === 0) {
      return res.status(404).json({ error: 'Staff profile not found' });
    }

    // No certType filter needed here

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const defaultStatuses = ['assigned', 'processing', 'ready_for_approval'];
    const statusParam = (req.query.status || '').trim();
    const statuses = statusParam
      ? statusParam.split(',').map((s) => s.trim()).filter(Boolean)
      : defaultStatuses;

    const q = (req.query.q || '').trim();
    const like = q ? `%${q}%` : null;

    let where = `c.assigned_staff_user_id = ?`;
    const params = [req.user.id];

    if (statuses.length) {
      where += ` AND c.status IN (${statuses.map(() => '?').join(',')})`;
      params.push(...statuses);
    }

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
       JOIN residents r ON c.resident_id = r.id
       WHERE ${where}`,
      params
    );
    const total = countRows[0]?.total || 0;

    const [certificates] = await pool.query(
      `SELECT
        c.*,
        r.firstname AS resident_firstname,
        r.lastname AS resident_lastname,
        r.phone_number AS resident_phone
       FROM certificates c
       JOIN residents r ON c.resident_id = r.id
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
      certificates,
    });
  } catch (err) {
    return serverError(res, err);
  }
};


const getCertificateById = async (req, res) => {
  const certId = Number(req.params.id);

  if (!Number.isInteger(certId)) {
    return res.status(400).json({ error: 'Invalid certificate ID' });
  }

  try {
    const [staffRows] = await pool.query(
      `SELECT position FROM kebele_staff WHERE user_id = ? LIMIT 1`,
      [req.user.id]
    );

    if (staffRows.length === 0) {
      return res.status(404).json({ error: 'Staff profile not found' });
    }

    // No certType filter needed here

    const [rows] = await pool.query(
      `SELECT
        c.*,
        r.firstname AS resident_firstname,
        r.lastname AS resident_lastname,
        r.phone_number AS resident_phone,
        r.address AS resident_address
       FROM certificates c
       JOIN residents r ON c.resident_id = r.id
       WHERE c.id = ?
         AND c.assigned_staff_user_id = ?
       LIMIT 1`,
      [certId, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    return res.status(200).json({ certificate: rows[0] });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * PUT /api/staff/certificates/:id/start-processing
 */
const startCertificateProcessing = async (req, res) => {
  const certId = Number(req.params.id);

  if (!Number.isInteger(certId)) {
    return res.status(400).json({ error: 'Invalid certificate ID' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE certificates
       SET status = 'processing'
       WHERE id = ?
         AND assigned_staff_user_id = ?
         AND status = 'assigned'`,
      [certId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Certificate not found, not assigned to you, or not in assigned status',
      });
    }

    await logCertificateAudit(certId, req.user.id, 'staff_start_processing', null);
    logger.info(`Staff ${req.user.id} started processing certificate ${certId}`);
    return res.status(200).json({ message: 'Processing started' });
  } catch (err) {
    return serverError(res, err);
  }
};


const uploadCertificatePdf = async (req, res) => {
  const certId = Number(req.params.id);

  if (!Number.isInteger(certId)) {
    return res.status(400).json({ error: 'Invalid certificate ID' });
  }

  const raw = req.body?.file_base64 || req.body?.pdf_base64;
  if (!raw || typeof raw !== 'string') {
    return res.status(400).json({
      error: 'JSON body must include file_base64 (base64-encoded PDF)',
    });
  }

  let base64 = raw.trim();
  if (base64.includes(',')) {
    base64 = base64.split(',')[1];
  }

  let buffer;
  try {
    buffer = Buffer.from(base64, 'base64');
  } catch {
    return res.status(400).json({ error: 'Invalid base64 payload' });
  }

  if (buffer.length < 10 || buffer.length > 15 * 1024 * 1024) {
    return res.status(400).json({ error: 'PDF must be non-empty and at most 15MB' });
  }

  if (buffer.slice(0, 4).toString() !== '%PDF') {
    return res.status(400).json({ error: 'Decoded file is not a PDF' });
  }

  const uploadDir = CERT_UPLOAD_DIR;

  try {
    const [rows] = await pool.query(
      `SELECT id, status, pdf_url, assigned_staff_user_id
       FROM certificates WHERE id = ? LIMIT 1`,
      [certId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const cert = rows[0];

    if (cert.assigned_staff_user_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not assigned to this certificate' });
    }

    if (!['assigned', 'processing'].includes(cert.status)) {
      return res.status(400).json({
        error: `Certificate must be in assigned or processing status to upload (current: ${cert.status})`,
      });
    }

    await fs.promises.mkdir(uploadDir, { recursive: true });
    const absPath = path.join(uploadDir, `cert_${certId}_${Date.now()}.pdf`);

    if (cert.pdf_url) {
      fs.unlink(cert.pdf_url, () => { });
    }

    await fs.promises.writeFile(absPath, buffer);

    await pool.query(
      `UPDATE certificates
       SET pdf_url = ?,
           status = CASE WHEN status = 'assigned' THEN 'processing' ELSE status END
       WHERE id = ?`,
      [absPath, certId]
    );

    await logCertificateAudit(certId, req.user.id, 'staff_upload_pdf', absPath);
    return res.status(200).json({ message: 'PDF uploaded successfully', pdf_url: absPath });
  } catch (err) {
    return serverError(res, err);
  }
};


const markCertificateReadyForApproval = async (req, res) => {
  const certId = Number(req.params.id);

  if (!Number.isInteger(certId)) {
    return res.status(400).json({ error: 'Invalid certificate ID' });
  }

  try {
    const cert = await loadAssignedCertificate(certId, req.user.id);

    if (!cert) {
      return res.status(404).json({ error: 'Certificate not found or not assigned to you' });
    }

    if (!['assigned', 'processing'].includes(cert.status)) {
      return res.status(400).json({
        error: `Certificate must be assigned or processing (current: ${cert.status})`,
      });
    }

    await ensureCertificatePdf(cert);

    const [result] = await pool.query(
      `UPDATE certificates
       SET status = 'ready_for_approval',
           prepared_by_user_id = ?,
           ready_for_approval_at = NOW()
       WHERE id = ? AND assigned_staff_user_id = ?
         AND status IN ('assigned', 'processing')`,
      [req.user.id, certId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Could not update certificate' });
    }

    await logCertificateAudit(certId, req.user.id, 'staff_ready_for_approval', null);
    await notifyAdminsCertificateReady(certId);

    logger.info(`Staff ${req.user.id} marked certificate ${certId} ready for approval`);
    return res.status(200).json({ message: 'Marked ready for approval' });
  } catch (err) {
    return serverError(res, err);
  }
};


const prepareCertificate = async (req, res) => {
  const certId = Number(req.params.id);

  if (!Number.isInteger(certId)) {
    return res.status(400).json({ error: 'Invalid certificate ID' });
  }

  try {
    const cert = await loadAssignedCertificate(certId, req.user.id);

    if (!cert) {
      return res.status(404).json({ error: 'Certificate not found or not assigned to you' });
    }

    if (!['assigned', 'processing'].includes(cert.status)) {
      return res.status(400).json({
        error: `Only assigned or in-progress requests can be prepared (current: ${cert.status})`,
      });
    }

    await ensureCertificatePdf(cert);

    const [result] = await pool.query(
      `UPDATE certificates
       SET status = 'ready_for_approval',
           prepared_by_user_id = ?,
           ready_for_approval_at = NOW()
       WHERE id = ? AND assigned_staff_user_id = ?
         AND status IN ('assigned', 'processing')`,
      [req.user.id, certId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Could not prepare certificate' });
    }

    await logCertificateAudit(certId, req.user.id, 'staff_prepare_submit', null);
    await notifyAdminsCertificateReady(certId);

    logger.info(`Staff ${req.user.id} prepared certificate ${certId} for admin approval`);
    return res.status(200).json({ message: 'Certificate submitted for admin approval' });
  } catch (err) {
    return serverError(res, err);
  }
};


const rejectCertificate = async (req, res) => {
  const certId = Number(req.params.id);

  if (!Number.isInteger(certId)) {
    return res.status(400).json({ error: 'Invalid certificate ID' });
  }

  const reason = (req.body?.reason || req.body?.rejection_reason || '').trim() || null;

  try {
    const [result] = await pool.query(
      `UPDATE certificates
       SET status = 'rejected',
           rejection_reason = ?,
           approved_by = NULL,
           approved_at = NULL
       WHERE id = ?
         AND assigned_staff_user_id = ?
         AND status IN ('assigned', 'processing')`,
      [reason, certId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Certificate not found, not assigned to you, or cannot be rejected now',
      });
    }

    await logCertificateAudit(
      certId,
      req.user.id,
      'staff_reject',
      reason
    );

    const residentUserId = await getResidentUserIdForCertificate(certId);
    await notifyUser(
      residentUserId,
      'Certificate request rejected',
      reason
        ? `Your certificate request #${certId} was rejected: ${reason}`
        : `Your certificate request #${certId} was rejected by the office.`,
      `/resident-dashboard`
    );

    logger.info(`Staff ${req.user.id} rejected certificate ${certId}`);
    return res.status(200).json({ message: 'Certificate rejected successfully' });
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
        CONCAT(r.firstname, ' ', r.lastname) AS resident,
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

const resolveReport = async (req, res) => {
  const reportId = Number(req.params.id);
  const { response } = req.body;

  if (!Number.isInteger(reportId)) {
    return res.status(400).json({ error: 'Invalid report ID' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE report
       SET status = 'completed', response = ?
       WHERE id = ?`,
      [response || null, reportId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    return res.status(200).json({ message: 'Report resolved successfully' });
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
  getCertificateById,
  startCertificateProcessing,
  uploadCertificatePdf,
  markCertificateReadyForApproval,
  prepareCertificate,
  rejectCertificate,
  getReports,
  resolveReport,
};