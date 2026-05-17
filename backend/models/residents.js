const { pool } = require('../config/connectDB');
// CREATE RESIDENT (CITIZEN PROFILE)

const create = async ({
  user_id,
  national_id,
  firstname,
  lastname,
  gender,
  date_of_birth,
  phone,
  marital_status,
  kebele_id,
  address = {},
  status
}) => {

  const { region, zone, woreda, kebele, houseNumber } = address;

  // CHECK USER EXISTS

  const [user] = await pool.query(
    `SELECT id FROM users WHERE id = ?`,
    [user_id]
  );

  if (!user[0]) {
    throw new Error("User not found");
  }


  // INSERT RESIDENT

  const [result] = await pool.query(
    `INSERT INTO residents (
      user_id,
      national_id,
      firstname,
      lastname,
      gender,
      date_of_birth,
      phone,
      marital_status,
      kebele_id,
      region,
      zone,
      woreda,
      kebele,
      house_number,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user_id,
      national_id,
      firstname,
      lastname,
      gender,
      date_of_birth || null,
      phone,
      marital_status || 'single',
      kebele_id,
      region,
      zone,
      woreda,
      kebele,
      houseNumber,
      status || 'active'
    ]
  );

  return findById(result.insertId);
};



// FIND RESIDENT BY ID

const findById = async (id) => {

  const [rows] = await pool.query(
    `SELECT
      r.*,
      u.email,
      u.role

    FROM residents r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.id = ?
    LIMIT 1`,
    [id]
  );

  if (!rows[0]) return null;

  const r = rows[0];

  return {
    id: r.id,
    userId: r.user_id,

    nationalId: r.national_id,
    firstname: r.firstname,
    lastname: r.lastname,

    gender: r.gender,
    birth_date: r.date_of_birth,
    phone: r.phone,
    maritalStatus: r.marital_status,

    kebeleId: r.kebele_id,

    address: {
      region: r.region,
      zone: r.zone,
      woreda: r.woreda,
      kebele: r.kebele,
      houseNumber: r.house_number
    },

    status: r.status,

    user: {
      email: r.email,
      role: r.role
    }
  };
};


// EXPORT

module.exports = {
  create,
  findById
};