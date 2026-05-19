const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');

const {
  getStaffProfile,
  getMyTasks,
  getSingleTask,
  startTask,
  completeTask,
  getTasksByType,
  getTasksByStatus,
  getCertificates,
  getCertificateById,
  startCertificateProcessing,
  uploadCertificatePdf,
  markCertificateReadyForApproval,
  prepareCertificate,
  rejectCertificate,
  getReports,
  resolveReport,
} = require('../controllers/kebeleStafsController');

// AUTH
router.use(protect, authorize('kebele_staff', 'admin'));

// PROFILE
router.get('/profile', getStaffProfile);

// CERTIFICATES (specific routes before :id)
router.get('/certificates', getCertificates);
router.put('/certificates/:id/start-processing', startCertificateProcessing);
router.post('/certificates/:id/upload-pdf', uploadCertificatePdf);
router.put('/certificates/:id/ready-for-approval', markCertificateReadyForApproval);
router.put('/certificates/:id/prepare', prepareCertificate);
router.put('/certificates/:id/reject', rejectCertificate);
router.get('/certificates/:id', getCertificateById);

// TASKS
router.get('/tasks', getMyTasks);
router.get('/tasks/:id', getSingleTask);

router.put('/tasks/:id/start', startTask);
router.put('/tasks/:id/complete', completeTask);

// FILTERS
router.get('/tasks/type/:type', getTasksByType);
router.get('/tasks/status/:status', getTasksByStatus);

// REPORTS
router.get('/reports', getReports);
router.put('/reports/:id/resolve', resolveReport);

module.exports = router;
