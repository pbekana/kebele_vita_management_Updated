const { pool } = require('./connectDB');

const createDeathReportTable = async () => {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS death_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        deceased_person_id INT NOT NULL,
        reporter_id INT NOT NULL,
        family_relationship_type VARCHAR(100),
        date_of_death DATE NOT NULL,
        cause_of_death TEXT,
        place_of_death VARCHAR(255),
        evidence_document VARCHAR(500),
        status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (deceased_person_id) REFERENCES residents(id) ON DELETE CASCADE,
        FOREIGN KEY (reporter_id) REFERENCES residents(id) ON DELETE CASCADE
      )
    `;

    await pool.query(createTableQuery);
    console.log('✓ Death reports table created successfully');
  } catch (error) {
    console.error('Error creating death_reports table:', error);
    throw error;
  }
};

module.exports = { createDeathReportTable };
