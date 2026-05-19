const { pool } = require('../config/connectDB');

// CREATE CERTIFICATE (ALL TYPES)

const create = async (data) => {

  const {
    resident_id,
    certificate_type,

    child_name,
    mother_name,
    father_name,
    birth_place,
    birth_date,

    death_date,
    cause_of_death,
    death_place,

    husband_name,
    wife_name,
    marriage_date,
    marriage_place,
    witness_name
  } = data;


  // VALIDATE RESIDENT
  
  const [resident] = await pool.query(
    `SELECT id FROM residents WHERE id = ?`,
    [resident_id]
  );

  if (!resident[0]) {
    throw new Error("Resident not found");
  }

 
  // VALIDATE CERT TYPE

  const allowedTypes = ['birth', 'mariage', 'death'];

  if (!allowedTypes.includes(certificate_type)) {
    throw new Error("Invalid certificate type");
  }


  // INSERT CERTIFICATE
 
  const [result] = await pool.query(
    `INSERT INTO certificates (
      resident_id,
      certificate_type,

      child_name,
      mother_name,
      father_name,
      birth_place,
      birth_date,

      death_date,
      cause_of_death,
      death_place,

      husband_name,
      wife_name,
      marriage_date,
      marriage_place,
      witness_name,

      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      resident_id,
      certificate_type,

      child_name || null,
      mother_name || null,
      father_name || null,
      birth_place || null,
      birth_date || null,

      death_date || null,
      cause_of_death || null,
      death_place || null,

      husband_name || null,
      wife_name || null,
      marriage_date || null,
      marriage_place || null,
      witness_name || null
    ]
  );

  return findById(result.insertId);
};


// FIND CERTIFICATE BY ID

const findById = async (id) => {

  const [rows] = await pool.query(
    `SELECT
      c.*,
      r.id AS residentId,
      r.firstname,
      r.lastname,
      r.phone_number,
      r.address

    FROM certificates c
    LEFT JOIN residents r ON c.resident_id = r.id
    WHERE c.id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};



// GET PENDING CERTIFICATES

const getPending = async () => {

  const [rows] = await pool.query(
    `SELECT *
     FROM certificates
     WHERE status IN ('pending','assigned','processing','ready_for_approval')
     ORDER BY requested_at DESC`
  );

  return rows;
};


// UPDATE STATUS (SAFE VERSION)

const updateStatus = async (id, status, userId = null) => {

  const params = userId
    ? [status, userId, id]
    : [status, id];

  const query = userId
    ? `UPDATE certificates SET status = ?, approved_by = ? WHERE id = ?`
    : `UPDATE certificates SET status = ? WHERE id = ?`;

  await pool.query(query, params);
};


module.exports = {
  create,
  findById,
  getPending,
  updateStatus
};