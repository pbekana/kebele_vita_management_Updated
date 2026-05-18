const logger = require('../utils/logger');

async function columnExists(pool, table, column) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return Number(rows[0].c) > 0;
}

async function tableExists(pool, table) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS c FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return Number(rows[0].c) > 0;
}

/**
 * Idempotent schema upgrades for certificate workflow (existing DBs).
 */
async function applyCertificateWorkflowMigration(pool) {
  try {
    if (!(await tableExists(pool, 'certificates'))) {
      return;
    }

    const addCol = async (name, ddl) => {
      if (!(await columnExists(pool, 'certificates', name))) {
        await pool.query(`ALTER TABLE certificates ${ddl}`);
        logger.info(`Migration: added certificates.${name}`);
      }
    };

    await addCol(
      'assigned_staff_user_id',
      'ADD COLUMN assigned_staff_user_id INT NULL'
    );
    await addCol(
      'assigned_by_user_id',
      'ADD COLUMN assigned_by_user_id INT NULL'
    );
    await addCol('assigned_at', 'ADD COLUMN assigned_at TIMESTAMP NULL');
    await addCol('rejection_reason', 'ADD COLUMN rejection_reason TEXT NULL');
    await addCol(
      'prepared_by_user_id',
      'ADD COLUMN prepared_by_user_id INT NULL'
    );
    await addCol(
      'ready_for_approval_at',
      'ADD COLUMN ready_for_approval_at TIMESTAMP NULL'
    );

    const fkSpecs = [
      { col: 'assigned_staff_user_id', name: 'fk_certificates_assigned_staff' },
      { col: 'assigned_by_user_id', name: 'fk_certificates_assigned_by' },
      { col: 'prepared_by_user_id', name: 'fk_certificates_prepared_by' },
    ];

    for (const { col, name } of fkSpecs) {
      const [existing] = await pool.query(
        `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'certificates'
         AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = ?`,
        [name]
      );
      if (existing.length === 0 && (await columnExists(pool, 'certificates', col))) {
        try {
          await pool.query(
            `ALTER TABLE certificates
             ADD CONSTRAINT ${name}
             FOREIGN KEY (${col}) REFERENCES users(id) ON DELETE SET NULL`
          );
          logger.info(`Migration: FK ${name}`);
        } catch (e) {
          logger.warn(`Migration: could not add FK ${name}: ${e.message}`);
        }
      }
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS certificate_audit_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        certificate_id INT NOT NULL,
        actor_user_id INT NULL,
        action VARCHAR(64) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (certificate_id) REFERENCES certificates(id) ON DELETE CASCADE,
        FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT,
        link_path VARCHAR(255) NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_notifications_user (user_id),
        INDEX idx_user_notifications_read (user_id, is_read)
      )
    `);

    const [ctypeRows] = await pool.query(
      `SELECT COLUMN_TYPE AS t FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'certificates' AND COLUMN_NAME = 'status'`
    );
    const colType = ctypeRows[0]?.t || '';

    if (colType.includes('ready_for_approval')) {
      return;
    }

    await pool.query(
      `ALTER TABLE certificates MODIFY COLUMN status ENUM(
        'pending',
        'in_review',
        'assigned',
        'processing',
        'ready_for_approval',
        'approved',
        'rejected',
        'issued'
      ) NOT NULL DEFAULT 'pending'`
    );

    await pool.query(
      `UPDATE certificates SET status = 'ready_for_approval' WHERE status = 'in_review'`
    );

    await pool.query(
      `ALTER TABLE certificates MODIFY COLUMN status ENUM(
        'pending',
        'assigned',
        'processing',
        'ready_for_approval',
        'approved',
        'rejected',
        'issued'
      ) NOT NULL DEFAULT 'pending'`
    );

    logger.info('Migration: certificates.status enum upgraded for workflow');
  } catch (err) {
    logger.error(`Certificate workflow migration failed: ${err.message}`);
    throw err;
  }
}

module.exports = { applyCertificateWorkflowMigration };
