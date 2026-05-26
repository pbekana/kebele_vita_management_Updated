const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { pool } = require("../config/connectDB");


// CREATE BIRTH CERTIFICATE REQUEST (USING children TABLE)
router.post("/", protect, async (req, res) => {
  try {

    const {
      child_name,
      birth_place,
      birth_date,
      target_child_id
    } = req.body;

    if (
      !child_name ||
      !birth_place ||
      !birth_date ||
      !target_child_id
    ) {
      return res.status(400).json({
        error: "All fields are required"
      });
    }

    // 1. GET REQUESTER (resident)
    const [requesterRows] = await pool.query(
      `SELECT id, marital_status FROM residents WHERE user_id = ?`,
      [req.user.id]
    );

    if (!requesterRows[0]) {
      return res.status(404).json({
        error: "Requester resident not found"
      });
    }

    const requester = requesterRows[0];
    if (requester.marital_status === 'single') {
      return res.status(400).json({
        error: 'You are currently single, so you cannot apply for a child birth certificate at this time. You can still apply for your own birth certificate.'
      });
    }

    const requester_id = requester.id;

    // 2. CHECK CHILD EXISTS
    const [childRows] = await pool.query(
      `SELECT * FROM children WHERE id = ?`,
      [target_child_id]
    );

    if (!childRows[0]) {
      return res.status(404).json({
        error: "Child not found"
      });
    }

    const child = childRows[0];

    // 3. SECURITY CHECK (ONLY PARENT CAN REQUEST)
    if (
      child.father_id !== requester_id &&
      child.mother_id !== requester_id
    ) {
      return res.status(403).json({
        error: "Only parents can request birth certificate for this child"
      });
    }

    // 4. CREATE CERTIFICATE
    const [result] = await pool.query(
      `INSERT INTO certificates (
        resident_id,
        certificate_type,
        child_name,
        birth_place,
        birth_date,
        status
      )
      VALUES (?, 'birth', ?, ?, ?, 'pending')`,
      [
        requester_id,
        child_name,
        birth_place,
        birth_date
      ]
    );

    return res.status(201).json({
      message: "Birth certificate request created successfully",
      certificateId: result.insertId
    });

  } catch (error) {
    return res.status(500).json({
      error: "Failed to create birth certificate",
      details: error.message
    });
  }
});

module.exports = router;