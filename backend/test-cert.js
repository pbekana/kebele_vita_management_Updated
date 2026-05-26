const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kebele_vital_db',
  });

  const [rows] = await pool.query(`SELECT
        c.*,
        r.firstname             AS resident_firstname,
        r.lastname              AS resident_lastname,
        r.gender                AS resident_gender,
        r.birth_date            AS resident_birth_date,
        r.birthplace            AS resident_birthplace,
        r.marital_status        AS resident_marital_status,
        r.father_name           AS resident_father_name,
        r.mother_name           AS resident_mother_name,
        r.spouse_id             AS resident_spouse_id,
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
        r.photo_path            AS resident_photo_path,
        r.registration_date     AS resident_registration_date,
        u.email AS resident_email
      FROM certificates c
      INNER JOIN residents r  ON c.resident_id = r.id
      INNER JOIN users u      ON r.user_id = u.id
      WHERE c.certificate_type = 'residency-id' OR c.certificate_type = 'residency'
      LIMIT 1`);

  if (rows.length > 0) {
    const cert = rows[0];
    const { validateAndSanitize } = require('./utils/certificateValidator');
    console.log("Raw cert:", cert);
    const data = validateAndSanitize(cert);
    console.log("Mapped data:", data);
  } else {
    console.log("No residency certs found.");
  }
  process.exit(0);
})();
