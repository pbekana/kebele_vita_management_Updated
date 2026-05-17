const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { pool } = require("../config/connectDB");


// CREATE DEATH CERTIFICATE REQUEST (WITH FAMILY VALIDATION)
router.post("/", protect, async (req, res) => {
  try {
    const {
      deceased_resident_id,
      death_date,
      cause_of_death
    } = req.body;

    if (!deceased_resident_id || !death_date || !cause_of_death) {
      return res.status(400).json({
        error: "deceased_resident_id, death_date and cause_of_death are required"
      });
    }

    // 1. Get requester resident
    const [requesterRows] = await pool.query(
      `SELECT id FROM residents WHERE user_id = ?`,
      [req.user.id]
    );

    if (!requesterRows[0]) {
      return res.status(404).json({
        error: "Requester resident profile not found"
      });
    }

    const requester_id = requesterRows[0].id;

    // 2. Check deceased exists
    const [deceasedRows] = await pool.query(
      `SELECT id FROM residents WHERE id = ?`,
      [deceased_resident_id]
    );

    if (!deceasedRows[0]) {
      return res.status(404).json({
        error: "Deceased resident not found"
      });
    }

    // 3. FAMILY RELATIONSHIP CHECK (ACTIVE SECURITY RULE)
    const [familyCheck] = await pool.query(
      `SELECT 1
       FROM family_relationships
       WHERE (resident_id = ? AND family_member_id = ?)
          OR (resident_id = ? AND family_member_id = ?)
       LIMIT 1`,
      [
        requester_id,
        deceased_resident_id,
        deceased_resident_id,
        requester_id
      ]
    );

    // ❗ THIS IS THE CRITICAL FIX
    if (!familyCheck[0]) {
      return res.status(403).json({
        error: "Only family members can request death certificate"
      });
    }

    // 4. Insert certificate
    const [result] = await pool.query(
      `INSERT INTO certificates (
        resident_id,
        certificate_type,
        death_date,
        cause_of_death,
        status
      )
      VALUES (?, 'death', ?, ?, 'pending')`,
      [
        deceased_resident_id,
        death_date,
        cause_of_death
      ]
    );

    return res.status(201).json({
      message: "Death certificate request created successfully",
      certificateId: result.insertId
    });

  } catch (error) {
    return res.status(500).json({
      error: "Failed to create death certificate",
      details: error.message
    });
  }
});

module.exports = router;