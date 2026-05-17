const { pool } = require('../config/connectDB');
const bcrypt = require('bcryptjs');



// CREATE USER (REGISTER)

const create = async ({
  email,
  password,
  role = 'resident',
  is_active = true,
}) => {


  // CHECK EMAIL EXISTS

  const [existing] = await pool.query(
    `SELECT id FROM users WHERE email = ?`,
    [email]
  );

  if (existing[0]) {
    throw new Error("Email already exists");
  }


  // HASH PASSWORD

  const hashedPassword = await bcrypt.hash(password, 10);


  // INSERT USER

  const [result] = await pool.query(
    `INSERT INTO users (
      email,
      password,
      role,
      is_active
    )
    VALUES (?, ?, ?, ?, ?)`,
    [
      email,
      hashedPassword,
      role,
      is_active
    ]
  );

  return findById(result.insertId);
};



// FIND USER BY ID

const findById = async (id) => {

  const [rows] = await pool.query(
    `SELECT
      id,
      email,
      role,
      is_active,
      created_at,
      updated_at
    FROM users
    WHERE id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};



// FIND USER BY EMAIL (LOGIN)

const findByEmail = async (email) => {

  const [rows] = await pool.query(
    `SELECT * FROM users WHERE email = ? LIMIT 1`,
    [email]
  );

  return rows[0] || null;
};



// UPDATE USER STATUS (activate/deactivate)

const updateStatus = async (id, is_active) => {

  await pool.query(
    `UPDATE users SET is_active = ? WHERE id = ?`,
    [is_active, id]
  );
};



// EXPORT

module.exports = {
  create,
  findById,
  findByEmail,
  updateStatus
};