const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { pool } = require("../config/connectDB");
const { validationResult } = require('express-validator');
const { createBirthCertificateValidator } = require("../validators/birthValidators");


// CREATE BIRTH CERTIFICATE REQUEST (USING children TABLE)
router.post("/", protect, createBirthCertificateValidator, async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array()[0].msg,
      errors: errors.array()
    });
  }

  try {

    const {
      child_name,
      birth_place,
      birth_date,
      target_child_id
    } = req.body;

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
    
    // VALIDATION 3: Check if user is single
    if (requester.marital_status === 'single') {
      return res.status(400).json({
        error: 'You are currently single and cannot apply for a child birth certificate. You can still apply for your own birth certificate.'
      });
    }

    const requester_id = requester.id;

    // VALIDATION 4: Check marriage duration (18 months minimum)
    if (requester.marital_status === 'married') {
      // Get the marriage date from certificates table
      const [marriageCerts] = await pool.query(
        `SELECT marriage_date, approved_at 
         FROM certificates 
         WHERE resident_id = ? 
         AND certificate_type = 'marriage' 
         AND status = 'approved'
         ORDER BY approved_at DESC
         LIMIT 1`,
        [requester_id]
      );

      if (marriageCerts[0] && marriageCerts[0].marriage_date) {
        const marriageDate = new Date(marriageCerts[0].marriage_date);
        const today = new Date();
        
        // Calculate months difference
        const monthsDiff = (today.getFullYear() - marriageDate.getFullYear()) * 12 
                          + (today.getMonth() - marriageDate.getMonth());
        
        // Require at least 18 months (1 year and 6 months)
        if (monthsDiff < 18) {
          return res.status(400).json({
            error: 'You recently got married. Child birth certificate registration is available after at least 1 year and 6 months from the marriage date.'
          });
        }
      }
    }

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