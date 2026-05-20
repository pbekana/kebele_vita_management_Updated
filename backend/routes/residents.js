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
const fs = require('fs');
const path = require('path');
const multer = require('multer');
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

const CERT_IMAGE_UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'certificates', 'images');
fs.mkdirSync(CERT_IMAGE_UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, CERT_IMAGE_UPLOAD_DIR),
    filename: (req, file, cb) => {
      const fileExt = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const imageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const documentTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

    if (file.fieldname === 'hospitalEvidence') {
      if (!documentTypes.includes(file.mimetype)) {
        return cb(new Error('Only PDF or image files are allowed for hospital evidence.'));
      }
      return cb(null, true);
    }

    if (!imageTypes.includes(file.mimetype)) {
      return cb(new Error('Only image uploads are allowed')); 
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

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
  upload.fields([
    { name: 'childPhoto', maxCount: 1 },
    { name: 'husbandPhoto', maxCount: 1 },
    { name: 'wifePhoto', maxCount: 1 },
    { name: 'deceasedPhoto', maxCount: 1 },
    { name: 'applicantPhoto', maxCount: 1 },
    { name: 'hospitalEvidence', maxCount: 1 },
  ]),
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