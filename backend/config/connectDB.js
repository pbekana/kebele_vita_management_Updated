const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'kebele_vital_db',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
});

const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`MySQL Connected: ${process.env.DB_HOST || 'localhost'}`);
    connection.release();
  } catch (err) {
    console.error(`Error connecting to MySQL: ${err.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB, pool };