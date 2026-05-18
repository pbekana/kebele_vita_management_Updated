const create = async ({
  resident_id,
  husband_name,
  wife_name,
  marriage_date,
  marriage_place,
  witness_name
}) => {

  // 1. CHECK RESIDENT EXISTS
  const [residentRows] = await pool.query(
    `SELECT id, marital_status FROM residents WHERE id = ?`,
    [resident_id]
  );

  if (!residentRows[0]) {
    throw new Error("Resident not found");
  }

  const resident = residentRows[0];

  // 2. CHECK MARITAL STATUS (CORE RULE)
  if (resident.marital_status === 'married') {
    throw new Error("Resident is already married");
  }

  // 3. CHECK EXISTING PENDING REQUEST
  const [existing] = await pool.query(
    `SELECT id FROM certificates
     WHERE resident_id = ?
     AND certificate_type = 'marriage'
     AND status IN ('pending','assigned','processing','ready_for_approval')`,
    [resident_id]
  );

  if (existing[0]) {
    throw new Error("Marriage certificate already requested");
  }

  // 4. INSERT CERTIFICATE
  const [result] = await pool.query(
    `INSERT INTO certificates (
      resident_id,
      certificate_type,
      husband_name,
      wife_name,
      marriage_date,
      marriage_place,
      witness_name,
      status
    )
    VALUES (?, 'marriage', ?, ?, ?, ?, ?, 'pending')`,
    [
      resident_id,
      husband_name,
      wife_name,
      marriage_date || null,
      marriage_place || null,
      witness_name || null
    ]
  );

  return findById(result.insertId);
};