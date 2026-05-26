const mysql = require('mysql2/promise');
const { generateCertificate } = require('./utils/pdfGenerator');
const fs = require('fs');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'kebele_vital_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

(async () => {
  try {
    const [rows] = await pool.query(`SELECT
        c.*,
        r.firstname             AS resident_firstname,
        r.lastname              AS resident_lastname,
        r.gender,
        r.birth_date            AS resident_birth_date,
        r.birthplace            AS resident_birthplace,
        r.marital_status,
        r.father_name,
        r.mother_name,
        r.spouse_id,
        r.phone_number,
        r.occupation,
        r.education_level,
        r.address,
        r.house_number,
        r.emergency_contact_name,
        r.emergency_contact_phone,
        r.nationality,
        r.religion,
        r.disability_status,
        r.photo_path,
        r.registration_date,
        u.email AS resident_email
      FROM certificates c
      INNER JOIN residents r  ON c.resident_id = r.id
      INNER JOIN users u      ON r.user_id = u.id
      LIMIT 1`);
    if (rows.length === 0) { console.log('No certs'); return; }
    const cert = rows[0];

    // Mock enrichment
    cert.certificate_type = 'birth';
    cert.child_full_name = 'Test Child';
    cert.child_birth_date = new Date('2020-01-01');
    cert.child_birthplace = 'Hospital';
    cert.child_gender = 'female';

    console.log("Raw cert:", cert);
    const { validateAndSanitize } = require('./utils/certificateValidator');
    const data = validateAndSanitize(cert);
    console.log("Mapped data:", data);

    const stream = fs.createWriteStream('test.pdf');
    generateCertificate(cert, stream);
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
