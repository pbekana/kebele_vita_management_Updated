const { pool } = require('../config/connectDB');
// FIND ID CARD BY ID

const findById = async (id) => {

  const [rows] = await pool.query(
    `SELECT
      c.id,
      c.id_number AS idNumber,
      c.issue_date AS issueDate,
      c.expiry_date AS expiryDate,
      c.status,

      r.id AS residentId,
      r.firstname,
      r.lastname,
      r.phone_number,
      r.national_id,

      u.id AS issuedById,
      issuer.firstname AS issuedByFirstname,
      issuer.lastname AS issuedByLastname,
      u.email AS issuedByEmail

    FROM id_cards c
    LEFT JOIN residents r ON c.resident_id = r.id
    LEFT JOIN users u ON c.issued_by = u.id
    LEFT JOIN residents issuer ON issuer.user_id = u.id
    WHERE c.id = ?
    LIMIT 1`,
    [id]
  );

  if (!rows[0]) return null;

  const r = rows[0];

  return {
    id: r.id,
    idNumber: r.idNumber,
    issueDate: r.issueDate,
    expiryDate: r.expiryDate,
    status: r.status,

    resident: {
      id: r.residentId,
      firstname: r.firstname,
      lastname: r.lastname,
      phoneNumber: r.phone_number,
      nationalId: r.national_id
    },

    issuedBy: r.issuedById ? {
      id: r.issuedById,
      firstname: r.issuedByFirstname,
      lastname: r.issuedByLastname,
      email: r.issuedByEmail
    } : null
  };
};



// EXPORT

module.exports = {
  create,
  findById
};