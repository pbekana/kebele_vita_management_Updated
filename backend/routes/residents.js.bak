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
  getCertificatePreviewData,
  createDeathReport,
  getMyChildren,
  registerChild,
  createMarriageRelationship,
  getMarriageRelationships,
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

// =======================
// CERTIFICATE DATA (Backend-Driven)
// =======================

// Get certificate preview data by type (birth, marriage, death, residency-id)
router.get('/certificate-data/:type', getCertificatePreviewData);

// =======================
// CHILDREN MANAGEMENT
// =======================

// Get all children
router.get('/children', getMyChildren);

// Register a new child
router.post(
  '/children',
  upload.single('hospitalEvidence'),
  [
    body('firstname').notEmpty().withMessage('Child firstname is required'),
    body('lastname').notEmpty().withMessage('Child lastname is required'),
    body('gender').isIn(['male', 'female']).withMessage('Gender must be male or female'),
    body('birth_date').isISO8601().withMessage('Birth date must be a valid date'),
    body('birthplace').notEmpty().withMessage('Birthplace is required'),
  ],
  registerChild
);

// =======================
// MARRIAGE RELATIONSHIPS
// =======================

router.get('/marriage-relationships', getMarriageRelationships);

router.post(
  '/marriage-relationships',
  [
    body('spouse_id').isInt().withMessage('Spouse ID is required'),
    body('marriage_date').isISO8601().withMessage('Marriage date must be a valid date'),
    body('marriage_place').notEmpty().withMessage('Marriage place is required'),
  ],
  createMarriageRelationship
);

// =======================
// DEATH REPORTS
// =======================

// Create a death report
router.post(
  '/death-report',
  upload.single('evidence_document'),
  [
    body('deceased_person_id').isInt().withMessage('Deceased person ID is required'),
    body('family_relationship_type').notEmpty().withMessage('Relationship type is required'),
    body('date_of_death').isISO8601().withMessage('Death date must be a valid date'),
    body('place_of_death').notEmpty().withMessage('Place of death is required'),
  ],
  createDeathReport
);

// Put generic route LAST
router.get('/:id', getResidentById);

module.exports = router;