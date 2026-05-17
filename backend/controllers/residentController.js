const fs = require('fs');
const { validationResult } = require('express-validator');

const { pool } = require('../config/connectDB');
const logger = require('../utils/logger');
const { generateCertificate } = require('../utils/pdfGenerator');

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
 * Helper: Generic server error
 */
const serverError = (
  res,
  err,
  message = 'Internal server error'
) => {
  logger.error(err);

  return res.status(500).json({
    error: message,
  });
};

/**
 * Helper: Get resident by authenticated user ID
 */
const getResident = async (userId) => {
  const [residents] = await pool.query(
    `SELECT
      id,
      user_id,
      birth_date,
      address,
      phone_number
    FROM residents
    WHERE user_id = ?
    LIMIT 1`,
    [userId]
  );

  return residents[0] || null;
};

/**
 * POST /api/residents/profile
 * Create or update resident profile
 */
// const createOrUpdateProfile = async (req, res) => {
//   if (handleValidationErrors(req, res)) return;

//   const {
//     birth_date,
//     address,
//     phone_number,
//   } = req.body;

//   try {
//     const resident = await getResident(req.user.id);

//     if (!resident) {
//       return res.status(404).json({
//         error: 'Resident profile not found',
//       });
//     }

//     await pool.query(
//       `UPDATE residents
//        SET
//          birth_date = ?,
//          address = ?,
//          phone_number = ?
//        WHERE user_id = ?`,
//       [
//         birth_date || null,
//         address || null,
//         phone_number || null,
//         req.user.id,
//       ]
//     );

//     const updatedResident = await getResident(req.user.id);

//     logger.info(
//       `Resident profile updated for user ${req.user.id}`
//     );

//     return res.status(200).json({
//       message: 'Profile updated successfully',
//       resident: updatedResident,
//     });

//   } catch (err) {
//     return serverError(res, err);
//   }
// };

/**
 * GET /api/residents/:id
 * Get resident by resident ID
 */
const getResidentById = async (req, res) => {
  const residentId = Number(req.params.id);

  if (!Number.isInteger(residentId)) {
    return res.status(400).json({
      error: 'Invalid resident ID',
    });
  }

  try {
    const [residents] = await pool.query(
      `SELECT
        r.id,
        r.birth_date,
        r.address,
        r.phone_number,
        u.email,
        u.role,
        u.is_active,
        u.created_at
      FROM residents r
      INNER JOIN users u
        ON r.user_id = u.id
      WHERE r.id = ?
      LIMIT 1`,
      [residentId]
    );

    if (residents.length === 0) {
      return res.status(404).json({
        error: 'Resident not found',
      });
    }

    return res.status(200).json({
      resident: residents[0],
    });

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * POST /api/residents/certificates/request
 * Request a certificate
 */
const requestCertificate = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const {
    certificate_type,
    // Birth fields
    childName, child_name = childName,
    motherName, mother_name = motherName,
    fatherName, father_name = fatherName,
    birthPlace, birth_place = birthPlace,
    birthDate, birth_date = birthDate,

    // Death fields
    deceasedName, deceased_name = deceasedName,
    deathDate, death_date = deathDate,
    causeOfDeath, cause_of_death = causeOfDeath,

    // Marriage fields
    husbandName, husband_name = husbandName,
    wifeName, wife_name = wifeName,
    marriageDate, marriage_date = marriageDate,
    marriagePlace, marriage_place = marriagePlace,
    witnessName, witness_name = witnessName
  } = req.body;

  let connection;

  try {
    connection = await pool.getConnection();

    await connection.beginTransaction();

    // Get resident profile
    const resident = await getResident(req.user.id);

    if (!resident) {
      await connection.rollback();

      return res.status(404).json({
        error: 'Complete resident profile first',
      });
    }

    const final_child_name = certificate_type === 'death' ? (deceased_name || null) : (child_name || null);

    let certificateId = null;

    if (certificate_type !== 'residency-id' && certificate_type !== 'residency') {
      // Create certificate request
      const [certificateResult] = await connection.query(
        `INSERT INTO certificates
        (
          resident_id,
          certificate_type,
          child_name,
          mother_name,
          father_name,
          birth_place,
          birth_date,
          death_date,
          cause_of_death,
          husband_name,
          wife_name,
          marriage_date,
          marriage_place,
          witness_name,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          resident.id,
          certificate_type,
          final_child_name,
          mother_name || null,
          father_name || null,
          birth_place || null,
          birth_date || null,
          death_date || null,
          cause_of_death || null,
          husband_name || null,
          wife_name || null,
          marriage_date || null,
          marriage_place || null,
          witness_name || null
        ]
      );
      certificateId = certificateResult.insertId;
    }

    const positionMap = {
      birth: 'birth_officer',
      marriage: 'marriage_officer',
      death: 'death_officer',
      'residency-id': 'id_officer',
      'residency': 'id_officer'
    };

    const taskTypeMap = {
      birth: 'birth_certificate',
      marriage: 'marriage_certificate',
      death: 'death_certificate',
      'residency-id': 'id_card',
      'residency': 'id_card'
    };

    const staffPosition = positionMap[certificate_type] || 'birth_officer';
    const taskType = taskTypeMap[certificate_type] || 'birth_certificate';

    const [staffRows] = await connection.query(
      `SELECT user_id FROM kebele_staff WHERE position = ? LIMIT 1`,
      [staffPosition]
    );

    if (staffRows.length > 0) {
      const staffUserId = staffRows[0].user_id;
      await connection.query(
        `INSERT INTO tasks (
          title,
          description,
          task_type,
          assigned_to,
          assigned_by,
          resident_id,
          status,
          due_date
        )
        VALUES (?, ?, ?, ?, ?, ?, 'pending', DATE_ADD(NOW(), INTERVAL 7 DAY))`,
        [
          `New ${certificate_type.replace('-', ' ')} Request`,
          `A resident has requested a new ${certificate_type}. Please process the request.`,
          taskType,
          staffUserId,
          staffUserId,
          resident.id
        ]
      );
    }

    await connection.commit();

    logger.info(
      `Certificate request ${certificateId || 'ID Card'} created by resident ${resident.id}`
    );

    return res.status(201).json({
      message: 'Certificate request submitted successfully',
      certificate_id: certificateId,
    });

  } catch (err) {
    if (connection) {
      await connection.rollback();
    }

    return serverError(res, err);

  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * GET /api/residents/certificates
 * Get resident certificates
 */
const getMyCertificates = async (req, res) => {
  try {
    const resident = await getResident(req.user.id);

    if (!resident) {
      return res.status(404).json({
        error: 'Resident profile not found',
      });
    }

    const [certificates] = await pool.query(
      `SELECT
        id,
        certificate_type,
        status,
        requested_at,
        approved_at,
        issued_at,
        issue_date,
        pdf_url
      FROM certificates
      WHERE resident_id = ?
      ORDER BY requested_at DESC`,
      [resident.id]
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
 * GET /api/residents/certificates/:id/download
 * Download issued certificate
 */
const downloadCertificate = async (req, res) => {
  const certificateId = Number(req.params.id);

  if (!Number.isInteger(certificateId)) {
    return res.status(400).json({
      error: 'Invalid certificate ID',
    });
  }

  try {
    const [certificates] = await pool.query(
      `SELECT
        c.id,
        c.certificate_type,
        c.status,
        c.issue_date,
        c.pdf_url,
        u.email AS resident_email
      FROM certificates c
      INNER JOIN residents r
        ON c.resident_id = r.id
      INNER JOIN users u
        ON r.user_id = u.id
      WHERE
        c.id = ?
        AND r.user_id = ?
      LIMIT 1`,
      [
        certificateId,
        req.user.id,
      ]
    );

    if (certificates.length === 0) {
      return res.status(404).json({
        error: 'Certificate not found',
      });
    }

    const certificate = certificates[0];

    // Check status
    if (certificate.status !== 'approved' && certificate.status !== 'issued') {
      return res.status(400).json({
        error: `Certificate status is '${certificate.status}', must be approved to download`,
      });
    }

    // Serve existing PDF
    if (
      certificate.pdf_url &&
      fs.existsSync(certificate.pdf_url)
    ) {
      return res.download(certificate.pdf_url);
    }

    // Generate temporary PDF stream
    res.setHeader(
      'Content-Type',
      'application/pdf'
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="certificate_${certificateId}.pdf"`
    );

    generateCertificate(
      certificate,
      res
    );

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * POST /api/residents/feedback
 * Submit feedback
 */
const submitFeedback = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const { message } = req.body;
  const description = message;

  try {
    const resident = await getResident(req.user.id);

    if (!resident) {
      return res.status(404).json({
        error: 'Resident profile not found',
      });
    }

    const [result] = await pool.query(
      `INSERT INTO report
      (
        resident_id,
        description
      )
      VALUES (?, ?)`,
      [
        resident.id,
        description,
      ]
    );

    logger.info(
      `Feedback submitted by resident ${resident.id}`
    );

    return res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback_id: result.insertId,
    });

  } catch (err) {
    return serverError(res, err);
  }
};

const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        r.id AS resident_id,
        r.birth_date,
        r.address,
        r.phone_number,
        u.firstname,
        u.lastname,
        u.email,
        u.created_at
      FROM residents r
      INNER JOIN users u ON r.user_id = u.id
      WHERE r.user_id = ?
      LIMIT 1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Resident profile not found',
      });
    }

    return res.status(200).json({
      profile: rows[0],
    });
  } catch (err) {
    return serverError(res, err);
  }
};

module.exports = {
  getResidentById,
  requestCertificate,
  getMyCertificates,
  downloadCertificate,
  submitFeedback,
  getProfile,
};