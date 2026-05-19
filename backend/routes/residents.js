// const express = require('express');
// const router = express.Router();
// const { body } = require('express-validator');
// const { protect } = require('../middleware/authMiddleware');

// const {
//   getResidentById,
//   requestCertificate,
//   getMyCertificates,
//   downloadCertificate,
//   submitFeedback,
//   getMyReports,
//   getProfile,
//   listMyNotifications,
//   markNotificationRead,
// } = require('../controllers/residentController');

// router.use(protect);

// // =======================
// // PROFILE ROUTES
// // =======================
// router.get('/profile', getProfile);
// router.get('/:id', getResidentById);



// // =======================
// // CERTIFICATE REQUEST
// // =======================

// router.post(
//   '/certificates/request',
//   [
//     body('certificate_type')
//       .isIn(['birth', 'marriage', 'death', 'residency', 'residency-id'])
//       .withMessage('certificate_type must be birth, marriage, death, residency, or residency-id'),
//   ],
//   requestCertificate
// );



// // =======================
// // MY CERTIFICATES
// // =======================

// router.get('/certificates', getMyCertificates);

// router.get('/notifications', listMyNotifications);
// router.patch('/notifications/:id/read', markNotificationRead);

// // =======================
// // DOWNLOAD CERTIFICATE
// // =======================

// router.get('/certificates/:id/download', downloadCertificate);



// // =======================
// // FEEDBACK
// // =======================

// router.get('/feedback', getMyReports);

// router.post(
//   '/feedback',
//   [
//     body('title')
//       .notEmpty()
//       .withMessage('Title is required'),
//     body('category')
//       .notEmpty()
//       .withMessage('Category is required'),
//     body('description')
//       .notEmpty()
//       .withMessage('Description is required'),
//   ],
//   submitFeedback
// );

// module.exports = router;
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
  getMyReports,
  getProfile,
  listMyNotifications,
  markNotificationRead,
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
      .isIn([
        'birth',
        'marriage',
        'death',
        'residency',
        'residency-id'
      ])
      .withMessage(
        'certificate_type must be birth, marriage, death, residency, or residency-id'
      ),
  ],
  requestCertificate
);

// =======================
// MY CERTIFICATES
// =======================

router.get('/certificates', getMyCertificates);

router.get('/notifications', listMyNotifications);
router.patch('/notifications/:id/read', markNotificationRead);

// =======================
// DOWNLOAD CERTIFICATE
// =======================

router.get('/certificates/:id/download', downloadCertificate);

// =======================
// FEEDBACK
// =======================

router.get('/feedback', getMyReports);

router.post(
  '/feedback',
  [
    body('title').notEmpty(),
    body('category').notEmpty(),
    body('description').notEmpty(),
  ],
  submitFeedback
);

// Put generic route LAST
router.get('/:id', getResidentById);

module.exports = router;