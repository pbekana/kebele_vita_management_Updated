const { pool } = require('../config/connectDB');
const bcrypt = require('bcryptjs');

// CREATE ADMIN USER (WRAPPER AROUND users TABLE)

const create = async ({ firstname, lastname, email, password }) => {


  // HASH PASSWORD
 
  const hashedPassword = await bcrypt.hash(password, 10);


  // INSERT INTO USERS TABLE
 
  const [result] = await pool.query(
    `INSERT INTO users (
      email,
      password,
      role
    )
    VALUES (?, ?, 'admin')`,
    [
      email,
      hashedPassword,
      role
    ]
  );

  return findById(result.insertId);
};



// FIND ADMIN BY ID

const findById = async (id) => {

  const [rows] = await pool.query(
    `SELECT
      id,
      email,
      role,
      created_at
    FROM users
    WHERE id = ? AND role = 'admin'
    LIMIT 1`,
    [id]
  );

  if (!rows[0]) return null;

  return rows[0];
};


module.exports = {
  create,
  findById
};