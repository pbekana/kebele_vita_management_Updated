const jwt = require('jsonwebtoken');
const { pool } = require('../config/connectDB');

// AUTHENTICATION MIDDLEWARE

const protect = async (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  try {
    const token = authHeader.split(' ')[1];

   
    // VERIFY TOKEN (NO FALLBACK SECRET)
  
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    // =========================
    // OPTIONAL: CHECK USER STILL ACTIVE
    // =========================
    const [rows] = await pool.query(
      `SELECT is_active FROM users WHERE id = ?`,
      [decoded.id]
    );

    if (!rows[0]) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    if (!rows[0].is_active) {
      return res.status(403).json({ error: 'Account deactivated' });
    }

    next();

  } catch (err) {

    return res.status(401).json({
      error: 'Not authorized, token invalid or expired'
    });
  }
};



// ROLE-BASED ACCESS CONTROL

const authorize = (...roles) => {

  return (req, res, next) => {

    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};
module.exports = {
  protect,
  authorize
};