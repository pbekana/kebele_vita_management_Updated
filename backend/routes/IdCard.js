const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { pool } = require("../config/connectDB");


// GET MY ID CARD (logged-in user)
router.get("/me", protect, async (req, res) => {
  try {

    const [rows] = await pool.query(
      `SELECT
        r.id AS resident_id,
        r.firstname,
        r.lastname,
        r.birth_date,
        r.address
       FROM residents r
       WHERE r.user_id = ?`,
      [req.user.id]
    );

    if (!rows[0]) {
      return res.status(404).json({
        error: "Resident profile not found"
      });
    }

    return res.json(rows[0]);

  } catch (error) {
    return res.status(500).json({
      error: "Failed to retrieve ID Card",
      details: error.message
    });
  }
});

module.exports = router;