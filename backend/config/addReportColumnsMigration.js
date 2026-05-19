require('dotenv').config();
const { pool } = require('./connectDB');

async function migrate() {
  try {
    console.log('Running report table migration...');
    await pool.query(`ALTER TABLE report ADD COLUMN title VARCHAR(255) AFTER resident_id;`);
    await pool.query(`ALTER TABLE report ADD COLUMN category VARCHAR(100) AFTER title;`);
    console.log('Migration completed successfully.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist, skipping migration.');
    } else {
      console.error('Migration failed:', err);
    }
  } finally {
    process.exit();
  }
}

migrate();
