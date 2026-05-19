require('dotenv').config();
const { pool } = require('./connectDB');

async function migrate() {
  try {
    console.log('Running certificates table death_place column migration...');
    await pool.query(`ALTER TABLE certificates ADD COLUMN death_place VARCHAR(255) NULL AFTER cause_of_death;`);
    console.log('Migration completed successfully.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column death_place already exists, skipping migration.');
    } else {
      console.error('Migration failed:', err);
    }
  } finally {
    process.exit();
  }
}

migrate();
