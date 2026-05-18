const { pool } = require('../config/connectDB');

async function logCertificateAudit(certificateId, actorUserId, action, details = null) {
  await pool.query(
    `INSERT INTO certificate_audit_log (certificate_id, actor_user_id, action, details)
     VALUES (?, ?, ?, ?)`,
    [certificateId, actorUserId || null, action, details]
  );
}

async function notifyUser(userId, title, body, linkPath = null) {
  if (!userId) return;
  await pool.query(
    `INSERT INTO user_notifications (user_id, title, body, link_path)
     VALUES (?, ?, ?, ?)`,
    [userId, title, body, linkPath]
  );
}

async function notifyUsers(userIds, title, body, linkPath = null) {
  const uniq = [...new Set((userIds || []).filter(Boolean))];
  for (const uid of uniq) {
    await notifyUser(uid, title, body, linkPath);
  }
}

async function getAdminUserIds() {
  const [rows] = await pool.query(
    `SELECT id FROM users WHERE role = 'admin' AND is_active = TRUE`
  );
  return rows.map((r) => r.id);
}

async function getResidentUserIdForCertificate(certId) {
  const [rows] = await pool.query(
    `SELECT r.user_id
     FROM certificates c
     INNER JOIN residents r ON c.resident_id = r.id
     WHERE c.id = ?
     LIMIT 1`,
    [certId]
  );
  return rows[0]?.user_id ?? null;
}

module.exports = {
  logCertificateAudit,
  notifyUser,
  notifyUsers,
  getAdminUserIds,
  getResidentUserIdForCertificate,
};
