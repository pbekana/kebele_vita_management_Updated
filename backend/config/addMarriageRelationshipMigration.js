const { pool } = require('./connectDB');

const createMarriageRelationshipTable = async () => {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS marriage_relationships (
        id INT AUTO_INCREMENT PRIMARY KEY,
        husband_id INT NOT NULL,
        wife_id INT NOT NULL,
        marriage_date DATE,
        marriage_place VARCHAR(255),
        status ENUM('active', 'divorced', 'annulled', 'separated') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (husband_id) REFERENCES residents(id) ON DELETE CASCADE,
        FOREIGN KEY (wife_id) REFERENCES residents(id) ON DELETE CASCADE,
        UNIQUE KEY unique_marriage_pair (husband_id, wife_id)
      )
    `;

    await pool.query(createTableQuery);
    console.log('✓ Marriage relationships table created successfully');
  } catch (error) {
    console.error('Error creating marriage_relationships table:', error);
    throw error;
  }
};

module.exports = { createMarriageRelationshipTable };
