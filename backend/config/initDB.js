const { pool } = require('./connectDB');
const { applyCertificateWorkflowMigration } = require('./applyCertificateWorkflowMigration');

const initDB = async () => {
  try {

    // 1. USERS TABLE
   
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,

        role ENUM(
          'resident',
          'kebele_staff',
          'admin'
        ) NOT NULL DEFAULT 'resident',

        is_active BOOLEAN NOT NULL DEFAULT TRUE,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 3. RESIDENTS TABLE
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS residents (
        id INT AUTO_INCREMENT PRIMARY KEY,

        user_id INT UNIQUE NULL,

        firstname VARCHAR(100) NOT NULL,
        lastname VARCHAR(100) NOT NULL,

        gender ENUM('male','female'),
        birth_date DATE,
        birthplace VARCHAR(255),

        marital_status ENUM('single','married','divorced','widowed'),
        father_name VARCHAR(255),
        mother_name VARCHAR(255),

        phone_number VARCHAR(20),
        occupation VARCHAR(100),

        education_level ENUM('none','primary','secondary','tertiary'),

        address TEXT,
        house_number VARCHAR(50),
        emergency_contact_name VARCHAR(255),
        emergency_contact_phone VARCHAR(20),

        nationality VARCHAR(100) DEFAULT 'Ethiopian',
        religion VARCHAR(100),
        disability_status BOOLEAN DEFAULT FALSE,

        photo_path VARCHAR(500),

        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      
      )
    `)
    //children tables
    await pool.query(
      `CREATE TABLE IF NOT EXISTS children (
    id INT AUTO_INCREMENT PRIMARY KEY,

    father_id INT NULL,
    mother_id INT NULL,

    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,

    gender ENUM('male','female') NOT NULL,

    birth_date DATE NOT NULL,
    birthplace VARCHAR(255),

    is_alive BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (father_id)
        REFERENCES residents(id)
        ON DELETE SET NULL,

    FOREIGN KEY (mother_id)
        REFERENCES residents(id)
        ON DELETE SET NULL
);
      `
    )
    // 4. KEBELE STAFF TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kebele_staff (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        employee_id VARCHAR(100) UNIQUE,
        position VARCHAR(100),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      
      )
    `);
    // 5. CERTIFICATES TABLE
    await pool.query(`
   CREATE TABLE IF NOT EXISTS certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,

  resident_id INT NOT NULL,

  certificate_type ENUM(
    'birth',
    'marriage',
    'death'
  ) NOT NULL,

 
  child_name VARCHAR(255),
  mother_name VARCHAR(255),
  father_name VARCHAR(255),
  birth_place VARCHAR(255),
  birth_date DATE,

  death_date DATE,
  cause_of_death TEXT,

 
  husband_name VARCHAR(255),
  wife_name VARCHAR(255),
  marriage_date DATE,
  marriage_place VARCHAR(255),
  witness_name VARCHAR(255),

  
  issue_date DATE,

  validity_period INT DEFAULT 365,

  pdf_url VARCHAR(500),

  assigned_staff_user_id INT NULL,
  assigned_by_user_id INT NULL,
  assigned_at TIMESTAMP NULL,
  rejection_reason TEXT NULL,
  prepared_by_user_id INT NULL,
  ready_for_approval_at TIMESTAMP NULL,

  status ENUM(
    'pending',
    'assigned',
    'processing',
    'ready_for_approval',
    'approved',
    'rejected',
    'issued'
  ) DEFAULT 'pending',

  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  approved_by INT,

  approved_at TIMESTAMP NULL,

  issued_by INT NULL,

  issued_at TIMESTAMP NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (resident_id)
    REFERENCES residents(id)
    ON DELETE CASCADE,

  FOREIGN KEY (approved_by)
    REFERENCES users(id)
    ON DELETE SET NULL,

  FOREIGN KEY (issued_by)
    REFERENCES users(id)
    ON DELETE SET NULL,

  FOREIGN KEY (assigned_staff_user_id)
    REFERENCES users(id)
    ON DELETE SET NULL,

  FOREIGN KEY (assigned_by_user_id)
    REFERENCES users(id)
    ON DELETE SET NULL,

  FOREIGN KEY (prepared_by_user_id)
    REFERENCES users(id)
    ON DELETE SET NULL )
`);

    // 6. SERVICE report TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS report(
        id INT AUTO_INCREMENT PRIMARY KEY,
        resident_id INT NOT NULL,
        description TEXT,
        status ENUM(
          'pending',
          'in_review',
          'completed',
          'rejected'
        ) DEFAULT 'pending',

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE
      )
    `);
    // 7. FEEDBACK TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        resident_id INT NOT NULL,
        response TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE
      )
    `);
    await pool.query(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(255) NOT NULL,

    description TEXT NULL,

    task_type ENUM(
      'id_card',
      'birth_certificate',
      'death_certificate',
      'marriage_certificate',
      'issue_report',
      'other'
    ) NOT NULL,

    assigned_to INT NOT NULL,

    assigned_by INT NOT NULL,

    resident_id INT NULL,
    status ENUM(
      'pending',
      'in_progress',
      'completed',
      'cancelled'
    ) DEFAULT 'pending',

    due_date DATE NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (assigned_to)
      REFERENCES users(id)
      ON DELETE CASCADE,

    FOREIGN KEY (assigned_by)
      REFERENCES users(id)
      ON DELETE CASCADE,

    FOREIGN KEY (resident_id)
      REFERENCES residents(id)
      ON DELETE SET NULL
  )
`);

    await applyCertificateWorkflowMigration(pool);

    console.log('MySQL tables initialized successfully.');

  } catch (err) {
    console.error(`Error initializing MySQL tables: ${err.message}`);
    process.exit(1);
  }
};

module.exports = initDB;

