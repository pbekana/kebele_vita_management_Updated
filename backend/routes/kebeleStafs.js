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
  prepareCertificate,
  rejectCertificate,
} = require('../controllers/kebeleStafsController');


// AUTH
router.use(protect, authorize('kebele_staff', 'admin'));


// PROFILE
router.get('/profile', getStaffProfile);

// CERTIFICATES
router.get('/certificates', getCertificates);
router.put('/certificates/:id/prepare', prepareCertificate);
router.put('/certificates/:id/reject', rejectCertificate);

// TASKS
router.get('/tasks', getMyTasks);
router.get('/tasks/:id', getSingleTask);

router.put('/tasks/:id/start', startTask);
router.put('/tasks/:id/complete', completeTask);


// FILTERS
router.get('/tasks/type/:type', getTasksByType);
router.get('/tasks/status/:status', getTasksByStatus);


module.exports = router;