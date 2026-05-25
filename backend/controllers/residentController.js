const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');

const { pool } = require('../config/connectDB');
const logger = require('../utils/logger');
const { generateCertificate } = require('../utils/pdfGenerator');

const backendRoot = path.join(__dirname, '..');
const normalizeUploadPath = (file) => {
  if (!file || !file.path) return null;
  return path.relative(backendRoot, file.path).replace(/\\/g, '/');
};


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

const getResident = async (userId) => {
  const [rows] = await pool.query('SELECT * FROM residents WHERE user_id = ? LIMIT 1', [userId]);
  return rows[0] || null;
};

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
        r.*,
        u.email,
        u.role,
        u.is_active,
        u.created_at AS user_created_at
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
    deathPlace, death_place = deathPlace,

    // Marriage fields
    husbandName, husband_name = husbandName,
    wifeName, wife_name = wifeName,
    marriageDate, marriage_date = marriageDate,
    marriagePlace, marriage_place = marriagePlace,
    witnessName, witness_name = witnessName,
    husbandBirthDate, husband_birth_date = husbandBirthDate,
    husbandBirthPlace, husband_birth_place = husbandBirthPlace,
    wifeBirthDate, wife_birth_date = wifeBirthDate,
    wifeBirthPlace, wife_birth_place = wifeBirthPlace,

    // Residency fields
    fullName, full_name = fullName,
    existingIdNumber, existing_id_number = existingIdNumber,
    hospitalEvidence, hospital_evidence = hospitalEvidence,
    deceasedResidentId, deceased_resident_id = deceasedResidentId
  } = req.body;

  const childPhotoPath = normalizeUploadPath(req.files?.childPhoto?.[0]);
  const husbandPhotoPath = normalizeUploadPath(req.files?.husbandPhoto?.[0]);
  const wifePhotoPath = normalizeUploadPath(req.files?.wifePhoto?.[0]);
  const deceasedPhotoPath = normalizeUploadPath(req.files?.deceasedPhoto?.[0]);
  const applicantPhotoPath = normalizeUploadPath(req.files?.applicantPhoto?.[0]);
  const hospitalEvidencePath = normalizeUploadPath(req.files?.hospitalEvidence?.[0]);

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

    if (certificate_type === 'birth') {
      const [matchingChildren] = await connection.query(
        `SELECT id FROM children WHERE lastname = ? LIMIT 1`,
        [resident.firstname]
      );

      if (matchingChildren.length === 0 && !hospitalEvidencePath) {
        await connection.rollback();
        return res.status(400).json({
          error: 'No child record was found with your name. Please upload a hospital evidence document before we can continue.',
        });
      }
    }

    let resolvedDeceasedResidentId = null;
    if (certificate_type === 'death') {
      if (deceased_resident_id) {
        resolvedDeceasedResidentId = Number(deceased_resident_id);
        if (!Number.isInteger(resolvedDeceasedResidentId) || resolvedDeceasedResidentId <= 0) {
          await connection.rollback();
          return res.status(400).json({
            error: 'Please provide a valid deceased resident ID.',
          });
        }
      }

      if (!resolvedDeceasedResidentId && deceased_name) {
        const nameParts = deceased_name.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        if (!firstName || !lastName) {
          await connection.rollback();
          return res.status(400).json({
            error: 'Please provide the full name of the deceased person.',
          });
        }

        const [matches] = await connection.query(
          `SELECT id FROM residents WHERE firstname = ? AND lastname = ? LIMIT 1`,
          [firstName, lastName]
        );

        if (matches.length === 0) {
          await connection.rollback();
          return res.status(404).json({
            error: 'We could not find a resident matching the deceased person’s name. Please verify the information and try again.',
          });
        }

        resolvedDeceasedResidentId = matches[0].id;
      }

      if (!resolvedDeceasedResidentId) {
        await connection.rollback();
        return res.status(400).json({
          error: 'A deceased resident must be identified before a death certificate can be requested.',
        });
      }

      const [familyCheck] = await connection.query(
        `SELECT 1 FROM family_relationships
         WHERE (resident_id = ? AND related_resident_id = ?)
            OR (resident_id = ? AND related_resident_id = ?)
         LIMIT 1`,
        [
          resident.id,
          resolvedDeceasedResidentId,
          resolvedDeceasedResidentId,
          resident.id,
        ]
      );

      if (!familyCheck[0]) {
        await connection.rollback();
        return res.status(403).json({
          error: 'A death certificate can only be requested by a valid family member of the deceased.',
        });
      }
    }

    const final_child_name = certificate_type === 'death' ? (deceased_name || null) :
                             (certificate_type === 'residency-id' || certificate_type === 'residency') ? (full_name || null) :
                             (child_name || full_name || null);

    const final_husband_name = (certificate_type === 'residency-id' || certificate_type === 'residency') ? (existing_id_number || null) : (husband_name || null);

    let certificateId = null;

    if (true) {
      if (applicantPhotoPath && (certificate_type === 'residency-id' || certificate_type === 'residency')) {
        await connection.query(
          `UPDATE residents SET photo_path = ? WHERE id = ?`,
          [applicantPhotoPath, resident.id]
        );
      }

      // Create certificate request
      const [certificateResult] = await connection.query(
        `INSERT INTO certificates
        (
          resident_id,
          certificate_type,
          child_name,
          child_photo_path,
          hospital_evidence_path,
          mother_name,
          father_name,
          birth_place,
          birth_date,
          deceased_resident_id,
          deceased_photo_path,
          death_date,
          cause_of_death,
          death_place,
          husband_name,
          husband_photo_path,
          wife_name,
          wife_photo_path,
          husband_birth_date,
          husband_birth_place,
          wife_birth_date,
          wife_birth_place,
          marriage_date,
          marriage_place,
          witness_name,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          resident.id,
          certificate_type,
          final_child_name,
          childPhotoPath,
          hospitalEvidencePath,
          mother_name || null,
          father_name || null,
          birth_place || null,
          birth_date || null,
          resolvedDeceasedResidentId,
          deceasedPhotoPath,
          death_date || null,
          cause_of_death || null,
          death_place || null,
          final_husband_name,
          husbandPhotoPath,
          wife_name || null,
          wifePhotoPath,
          husband_birth_date || null,
          husband_birth_place || null,
          wife_birth_date || null,
          wife_birth_place || null,
          marriage_date || null,
          marriage_place || null,
          witness_name || null
        ]
      );
      certificateId = certificateResult.insertId;
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
        pdf_url,
        rejection_reason
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
 * Download issued certificate — generates an A5 PDF with full resident data.
 */
const downloadCertificate = async (req, res) => {
  const certificateId = Number(req.params.id);

  if (!Number.isInteger(certificateId)) {
    return res.status(400).json({
      error: 'Invalid certificate ID',
    });
  }

  try {
    // Fetch certificate + all resident personal fields in one query
    const [rows] = await pool.query(
      `SELECT
        c.*,
        r.firstname             AS resident_firstname,
        r.lastname              AS resident_lastname,
        r.gender,
        r.birth_date            AS resident_birth_date,
        r.birthplace            AS resident_birthplace,
        r.marital_status,
        r.father_name,
        r.mother_name,
        r.spouse_id,
        r.phone_number,
        r.occupation,
        r.education_level,
        r.address,
        r.house_number,
        r.emergency_contact_name,
        r.emergency_contact_phone,
        r.nationality,
        r.religion,
        r.disability_status,
        r.photo_path,
        r.registration_date,
        u.email AS resident_email
      FROM certificates c
      INNER JOIN residents r  ON c.resident_id = r.id
      INNER JOIN users u      ON r.user_id = u.id
      WHERE c.id = ?
        AND r.user_id = ?
      LIMIT 1`,
      [certificateId, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const cert = rows[0];

    // Block PDF generation for non-approved certificates
    if (cert.status !== 'approved' && cert.status !== 'issued') {
      return res.status(400).json({
        error: `Certificate status is '${cert.status}', must be approved to download`,
      });
    }

    // ── TYPE-SPECIFIC DATA ENRICHMENT ────────────────────────────────────

    // BIRTH: Get actual child data from children table
    if (cert.certificate_type === 'birth' && cert.child_name) {
      // Try to find child by name matching the certificate
      const childNameParts = cert.child_name.trim().split(/\s+/);
      const childFirst = childNameParts[0] || '';
      const [childRows] = await pool.query(
        `SELECT firstname, lastname, gender, birth_date, birthplace
         FROM children
         WHERE (father_id = ? OR mother_id = ?)
         AND firstname LIKE ?
         LIMIT 1`,
        [cert.resident_id, cert.resident_id, `${childFirst}%`]
      );
      if (childRows.length > 0) {
        const child = childRows[0];
        cert.child_full_name = `${child.firstname} ${child.lastname}`;
        cert.child_birth_date = child.birth_date;
        cert.child_birthplace = child.birthplace;
        cert.child_gender = child.gender;
      } else {
        cert.child_full_name = cert.child_name;
      }
      // For birth cert, father/mother name comes from the resident
      if (cert.gender === 'male') {
        cert.father_name = cert.father_name || `${cert.resident_firstname} ${cert.resident_lastname}`;
      } else {
        cert.mother_name = cert.mother_name || `${cert.resident_firstname} ${cert.resident_lastname}`;
      }
    }

    // MARRIAGE: Enrich with marriage_relationships and spouse data
    if (cert.certificate_type === 'marriage') {
      const residentFullName = `${cert.resident_firstname} ${cert.resident_lastname}`.trim();

      // Check marriage_relationships table for enriched data
      const [marriageRows] = await pool.query(
        `SELECT mr.*,
           h.firstname AS h_firstname, h.lastname AS h_lastname,
           h.birth_date AS h_birth_date, h.birthplace AS h_birthplace, h.gender AS h_gender,
           w.firstname AS w_firstname, w.lastname AS w_lastname,
           w.birth_date AS w_birth_date, w.birthplace AS w_birthplace, w.gender AS w_gender
         FROM marriage_relationships mr
         INNER JOIN residents h ON mr.husband_id = h.id
         INNER JOIN residents w ON mr.wife_id = w.id
         WHERE mr.husband_id = ? OR mr.wife_id = ?
         ORDER BY mr.created_at DESC
         LIMIT 1`,
        [cert.resident_id, cert.resident_id]
      );

      if (marriageRows.length > 0) {
        const m = marriageRows[0];
        cert.husband_name = `${m.h_firstname} ${m.h_lastname}`.trim();
        cert.wife_name    = `${m.w_firstname} ${m.w_lastname}`.trim();
        cert.husband_birth_date  = m.h_birth_date;
        cert.husband_birth_place = m.h_birthplace;
        cert.wife_birth_date     = m.w_birth_date;
        cert.wife_birth_place    = m.w_birthplace;
        cert.marriage_date  = cert.marriage_date  || m.marriage_date;
        cert.marriage_place = cert.marriage_place || m.marriage_place;
      } else if (cert.husband_name || cert.wife_name) {
        // Fallback: data already stored in the certificate row itself
        // Try to enrich one side from the resident row
        if (cert.gender === 'male') {
          cert.husband_name = cert.husband_name || residentFullName;
          cert.husband_birth_date  = cert.husband_birth_date  || cert.resident_birth_date;
          cert.husband_birth_place = cert.husband_birth_place || cert.resident_birthplace;
        } else {
          cert.wife_name = cert.wife_name || residentFullName;
          cert.wife_birth_date  = cert.wife_birth_date  || cert.resident_birth_date;
          cert.wife_birth_place = cert.wife_birth_place || cert.resident_birthplace;
        }
      }

      // Resolve spouse name from residents table if still missing one side
      if (cert.spouse_id && (!cert.husband_name || !cert.wife_name)) {
        const [spouseRows] = await pool.query(
          `SELECT firstname, lastname, birth_date, birthplace, gender FROM residents WHERE id = ? LIMIT 1`,
          [cert.spouse_id]
        );
        if (spouseRows.length > 0) {
          const sp = spouseRows[0];
          const spouseFull = `${sp.firstname} ${sp.lastname}`;
          if (sp.gender === 'male' || cert.gender === 'female') {
            cert.husband_name        = cert.husband_name || spouseFull;
            cert.husband_birth_date  = cert.husband_birth_date  || sp.birth_date;
            cert.husband_birth_place = cert.husband_birth_place || sp.birthplace;
          } else {
            cert.wife_name        = cert.wife_name || spouseFull;
            cert.wife_birth_date  = cert.wife_birth_date  || sp.birth_date;
            cert.wife_birth_place = cert.wife_birth_place || sp.birthplace;
          }
        }
      }
    }

    // DEATH: Enrich with deceased person data
    if (cert.certificate_type === 'death' && cert.deceased_resident_id) {
      const [deceasedRows] = await pool.query(
        `SELECT firstname, lastname, gender, birth_date FROM residents WHERE id = ? LIMIT 1`,
        [cert.deceased_resident_id]
      );
      if (deceasedRows.length > 0) {
        const dec = deceasedRows[0];
        cert.deceased_full_name = `${dec.firstname} ${dec.lastname}`;
        cert.deceased_gender    = dec.gender;
        cert.deceased_birth_date = dec.birth_date;
        // For death cert the "child_name" field stores the deceased name in the legacy flow
        cert.child_name = cert.child_name || cert.deceased_full_name;
      }
    }

    // Resolve spouse name for residency certs (married residents)
    if (
      cert.certificate_type !== 'marriage' &&
      (cert.marital_status || '').toLowerCase() === 'married' &&
      cert.spouse_id
    ) {
      const [spouseRows] = await pool.query(
        `SELECT firstname, lastname FROM residents WHERE id = ? LIMIT 1`,
        [cert.spouse_id]
      );
      if (spouseRows.length > 0) {
        cert.spouse_name = `${spouseRows[0].firstname} ${spouseRows[0].lastname}`;
      }
    }

    // Always generate a fresh standards-compliant PDF from the template.
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="certificate_${certificateId}.pdf"`
    );

    generateCertificate(cert, res);

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

  const { title, category, description } = req.body;

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
        title,
        category,
        description
      )
      VALUES (?, ?, ?, ?)`,
      [
        resident.id,
        title,
        category,
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

const getMyReports = async (req, res) => {
  try {
    const resident = await getResident(req.user.id);

    if (!resident) {
      return res.status(404).json({
        error: 'Resident profile not found',
      });
    }

    const [reports] = await pool.query(
      `SELECT * FROM report
       WHERE resident_id = ?
       ORDER BY created_at DESC`,
      [resident.id]
    );

    return res.status(200).json({
      count: reports.length,
      reports,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        r.*,
        r.id AS resident_id,
        u.email,
        u.created_at AS user_created_at
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

    const profile = rows[0];

    // Fetch related data dynamically
    const [children] = await pool.query(
      `SELECT * FROM children WHERE father_id = ? OR mother_id = ?`,
      [profile.id, profile.id]
    );

    const [familyRelationships] = await pool.query(
      `SELECT fr.*, r.firstname, r.lastname 
       FROM family_relationships fr
       INNER JOIN residents r ON fr.related_resident_id = r.id
       WHERE fr.resident_id = ?`,
      [profile.id]
    );

    const [marriageRelationships] = await pool.query(
      `SELECT * FROM marriage_relationships 
       WHERE husband_id = ? OR wife_id = ?`,
      [profile.id, profile.id]
    );

    const [deathReports] = await pool.query(
      `SELECT * FROM death_reports WHERE reporter_id = ?`,
      [profile.id]
    );

    profile.children = children;
    profile.family_relationships = familyRelationships;
    profile.marriage_relationships = marriageRelationships;
    profile.death_reports = deathReports;

    return res.status(200).json({
      profile,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * GET /api/residents/notifications
 */
const listMyNotifications = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, body, link_path, is_read, created_at
       FROM user_notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.user.id]
    );

    return res.status(200).json({
      count: rows.length,
      notifications: rows,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * PATCH /api/residents/notifications/:id/read
 */
const markNotificationRead = async (req, res) => {
  const notificationId = Number(req.params.id);

  if (!Number.isInteger(notificationId)) {
    return res.status(400).json({ error: 'Invalid notification id' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE user_notifications
       SET is_read = TRUE
       WHERE id = ? AND user_id = ?`,
      [notificationId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.status(200).json({ message: 'Marked as read' });
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * GET /api/residents/certificate-data/:type
 * Fetch backend-driven certificate data by type (birth, marriage, death, residency-id)
 */
const getCertificatePreviewData = async (req, res) => {
  const { type } = req.params;
  const allowedTypes = ['birth', 'marriage', 'death', 'residency-id', 'residency'];

  if (!allowedTypes.includes(type)) {
    return res.status(400).json({
      error: 'Invalid certificate type',
    });
  }

  try {
    const [residentRows] = await pool.query(
      `SELECT r.id, r.firstname, r.lastname, r.gender, r.birth_date, r.birthplace, 
              r.phone_number, u.email, r.marital_status, r.spouse_id
       FROM residents r
       JOIN users u ON u.id = r.user_id
       WHERE r.user_id = ?
       LIMIT 1`,
      [req.user.id]
    );

    if (residentRows.length === 0) {
      return res.status(404).json({
        error: 'Resident profile not found',
      });
    }

    const resident = residentRows[0];
    const data = {
      resident: resident,
      certificateType: type,
      children: [],
      spouseData: null,
      deathReports: [],
    };

    // Birth Certificate Data
    if (type === 'birth') {
      const [children] = await pool.query(
        `SELECT id, firstname, lastname, gender, birth_date, birthplace
         FROM children
         WHERE father_id = ? OR mother_id = ?
         ORDER BY birth_date DESC`,
        [resident.id, resident.id]
      );
      data.children = children;
    }

    // Marriage Certificate Data
    if (type === 'marriage') {
      // First check marriage_relationships for the most complete data
      const [marriages] = await pool.query(
        `SELECT mr.*,
           h.firstname AS h_firstname, h.lastname AS h_lastname,
           h.birth_date AS h_birth_date, h.birthplace AS h_birthplace,
           w.firstname AS w_firstname, w.lastname AS w_lastname,
           w.birth_date AS w_birth_date, w.birthplace AS w_birthplace
         FROM marriage_relationships mr
         INNER JOIN residents h ON mr.husband_id = h.id
         INNER JOIN residents w ON mr.wife_id = w.id
         WHERE (mr.husband_id = ? OR mr.wife_id = ?)
         AND mr.status = 'active'
         ORDER BY mr.created_at DESC
         LIMIT 1`,
        [resident.id, resident.id]
      );

      if (marriages.length > 0) {
        const m = marriages[0];
        data.marriageRelationship = m;

        // Determine which resident is husband vs wife
        const isHusband = m.husband_id === resident.id;
        const spouseId  = isHusband ? m.wife_id : m.husband_id;

        data.spouseData = {
          id:        spouseId,
          firstname: isHusband ? m.w_firstname : m.h_firstname,
          lastname:  isHusband ? m.w_lastname  : m.h_lastname,
          birth_date: isHusband ? m.w_birth_date : m.h_birth_date,
          birthplace: isHusband ? m.w_birthplace : m.h_birthplace,
        };
      } else if (resident.spouse_id) {
        // Fallback: use spouse_id from residents table
        const [spouse] = await pool.query(
          `SELECT id, firstname, lastname, gender, birth_date, birthplace, phone_number
           FROM residents WHERE id = ? LIMIT 1`,
          [resident.spouse_id]
        );
        if (spouse.length > 0) {
          data.spouseData = spouse[0];
        }
      }
    }


    // Death Certificate Data
    if (type === 'death') {
      const [deaths] = await pool.query(
        `SELECT * FROM death_reports
         WHERE reporter_id = ?
         AND status != 'rejected'
         ORDER BY created_at DESC
         LIMIT 10`,
        [resident.id]
      );
      data.deathReports = deaths;

      // Also fetch deceased person details if available
      if (deaths.length > 0) {
        const deceasedIds = deaths.map(d => d.deceased_person_id);
        const [deceasedPeople] = await pool.query(
          `SELECT id, firstname, lastname, gender, birth_date, birthplace
           FROM residents
           WHERE id IN (${deceasedIds.map(() => '?').join(',')})`,
          deceasedIds
        );
        data.deceasedPeople = deceasedPeople;
      }
    }

    // Residency ID Data (uses resident info mainly)
    if (type === 'residency-id' || type === 'residency') {
      // Just use resident data already fetched
      data.residencyInfo = {
        fullName: `${resident.firstname} ${resident.lastname}`,
        phone: resident.phone_number,
      };
    }

    return res.status(200).json(data);

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * POST /api/residents/death-report
 * Create a death report
 */
const createDeathReport = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const {
    deceased_person_id,
    family_relationship_type,
    date_of_death,
    cause_of_death,
    place_of_death,
  } = req.body;

  const evidenceDocPath = normalizeUploadPath(req.files?.evidence_document?.[0]);

  try {
    const [residentRows] = await pool.query(
      `SELECT id FROM residents WHERE user_id = ? LIMIT 1`,
      [req.user.id]
    );

    if (residentRows.length === 0) {
      return res.status(404).json({
        error: 'Resident profile not found',
      });
    }

    const reporterId = residentRows[0].id;

    // Verify family relationship exists
    const [familyCheck] = await pool.query(
      `SELECT 1 FROM family_relationships
       WHERE (resident_id = ? AND related_resident_id = ?)
          OR (resident_id = ? AND related_resident_id = ?)
       LIMIT 1`,
      [reporterId, deceased_person_id, deceased_person_id, reporterId]
    );

    if (familyCheck.length === 0) {
      return res.status(403).json({
        error: 'Only family members can file death reports',
      });
    }

    const [result] = await pool.query(
      `INSERT INTO death_reports
       (deceased_person_id, reporter_id, family_relationship_type, date_of_death, cause_of_death, place_of_death, evidence_document, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [deceased_person_id, reporterId, family_relationship_type, date_of_death, cause_of_death, place_of_death, evidenceDocPath]
    );

    logger.info(`Death report ${result.insertId} created by resident ${reporterId}`);

    return res.status(201).json({
      message: 'Death report submitted successfully',
      report_id: result.insertId,
    });

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * GET /api/residents/children
 * Get all children associated with resident (as parent)
 */
const getMyChildren = async (req, res) => {
  try {
    const [residentRows] = await pool.query(
      `SELECT id FROM residents WHERE user_id = ? LIMIT 1`,
      [req.user.id]
    );

    if (residentRows.length === 0) {
      return res.status(404).json({
        error: 'Resident profile not found',
      });
    }

    const residentId = residentRows[0].id;

    const [children] = await pool.query(
      `SELECT * FROM children
       WHERE father_id = ? OR mother_id = ?
       ORDER BY birth_date DESC`,
      [residentId, residentId]
    );

    return res.status(200).json({
      count: children.length,
      children,
    });

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * POST /api/residents/children
 * Register a new child
 */
const registerChild = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const {
    firstname,
    lastname,
    gender,
    birth_date,
    birthplace,
    father_id,
    mother_id,
  } = req.body;

  const hospitalEvidencePath = normalizeUploadPath(req.file);

  try {
    const [residentRows] = await pool.query(
      `SELECT id FROM residents WHERE user_id = ? LIMIT 1`,
      [req.user.id]
    );

    if (residentRows.length === 0) {
      return res.status(404).json({
        error: 'Resident profile not found',
      });
    }

    const currentResidentId = residentRows[0].id;

    const parsedFatherId = father_id ? Number(father_id) : null;
    const parsedMotherId = mother_id ? Number(mother_id) : null;

    // Verify that current resident is one of the parents
    if (parsedFatherId !== currentResidentId && parsedMotherId !== currentResidentId) {
      return res.status(403).json({
        error: 'Child registration failed: Current resident must be one of the parents',
      });
    }

    const [result] = await pool.query(
      `INSERT INTO children (firstname, lastname, gender, birth_date, birthplace, father_id, mother_id, hospital_evidence, is_alive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [firstname, lastname, gender, birth_date, birthplace, parsedFatherId, parsedMotherId, hospitalEvidencePath]
    );

    logger.info(`Child ${result.insertId} registered by resident ${currentResidentId}`);

    return res.status(201).json({
      message: 'Child registered successfully',
      child_id: result.insertId,
    });

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * POST /api/residents/marriage-relationships
 * Create a new marriage relationship
 */
const createMarriageRelationship = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const { spouse_id, marriage_date, marriage_place } = req.body;

  try {
    const [residentRows] = await pool.query(
      `SELECT id, gender FROM residents WHERE user_id = ? LIMIT 1`,
      [req.user.id]
    );

    if (residentRows.length === 0) {
      return res.status(404).json({ error: 'Resident profile not found' });
    }

    const currentResident = residentRows[0];
    const husband_id = currentResident.gender === 'male' ? currentResident.id : spouse_id;
    const wife_id = currentResident.gender === 'female' ? currentResident.id : spouse_id;

    const [result] = await pool.query(
      `INSERT INTO marriage_relationships (husband_id, wife_id, marriage_date, marriage_place, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [husband_id, wife_id, marriage_date, marriage_place]
    );

    logger.info(`Marriage relationship ${result.insertId} created by resident ${currentResident.id}`);

    return res.status(201).json({
      message: 'Marriage relationship created successfully',
      relationship_id: result.insertId,
    });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'A marriage relationship already exists between these residents.' });
    }
    return serverError(res, err);
  }
};

/**
 * GET /api/residents/marriage-relationships
 * Get all marriage relationships for resident
 */
const getMarriageRelationships = async (req, res) => {
  try {
    const [residentRows] = await pool.query(
      `SELECT id FROM residents WHERE user_id = ? LIMIT 1`,
      [req.user.id]
    );

    if (residentRows.length === 0) {
      return res.status(404).json({ error: 'Resident profile not found' });
    }

    const residentId = residentRows[0].id;

    const [relationships] = await pool.query(
      `SELECT * FROM marriage_relationships
       WHERE husband_id = ? OR wife_id = ?`,
      [residentId, residentId]
    );

    return res.status(200).json({
      count: relationships.length,
      relationships,
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
  getMyReports,
  getProfile,
  listMyNotifications,
  markNotificationRead,
  getCertificatePreviewData,
  createDeathReport,
  getMyChildren,
  registerChild,
  createMarriageRelationship,
  getMarriageRelationships,
};