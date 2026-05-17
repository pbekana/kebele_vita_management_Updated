const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');

const {
  getResidentById,
  requestCertificate,
  getMyCertificates,
  downloadCertificate,
  submitFeedback,
  getProfile,
} = require('../controllers/residentController');

router.use(protect);

// =======================
// PROFILE ROUTES
// =======================
router.get('/profile', getProfile);



// =======================
// CERTIFICATE REQUEST
// =======================

router.post(
  '/certificates/request',
  [
    body('certificate_type')
      .isIn(['birth', 'marriage', 'death', 'residency', 'residency-id'])
      .withMessage('certificate_type must be birth, marriage, death, residency, or residency-id'),
  ],
  requestCertificate
);



// =======================
// MY CERTIFICATES
// =======================

router.get('/certificates', getMyCertificates);



// =======================
// DOWNLOAD CERTIFICATE
// =======================

router.get('/certificates/:id/download', downloadCertificate);



// =======================
// FEEDBACK
// =======================

router.post(
  '/feedback',
  [
    body('message')
      .notEmpty()
      .withMessage('Message is required'),
  ],
  submitFeedback
);

module.exports = router;