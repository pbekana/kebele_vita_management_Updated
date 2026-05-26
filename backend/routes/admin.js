const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createUser, activateUser, deactivateUser, listUsers,
  assignKebeleStaff, assignCertificate, approveCertificate, getStaffList,
  getCertificates, rejectCertificate, getReports, updateReportStatus
} = require('../controllers/adminController');
const {
  createTask, getAllTasks, reassignTask, updateTask
} = require('../controllers/taskController');
const { createTaskValidator } = require('../validators/taskValidators');

// All admin routes require auth + 'admin' role
router.use(protect, authorize('admin'));

router.post('/users', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  body('role').isIn(['admin','resident','kebele_staff']).withMessage('Invalid role'),
], createUser);

router.put('/users/:id/activate', activateUser);
router.put('/users/:id/deactivate', deactivateUser);
router.get('/users', listUsers);

router.put('/assignKebeleStaff', [
  body('user_id').isInt().withMessage('user_id must be integer')
],assignKebeleStaff);

router.get('/certificates', getCertificates);
router.put('/certificates/:id/assign', assignCertificate);
router.put('/certificates/:id/approve', approveCertificate);
router.put('/certificates/:id/reject', rejectCertificate);

router.get('/staff', getStaffList);

router.get('/tasks', getAllTasks);
router.post('/tasks/create', createTaskValidator, createTask);
router.put('/tasks/:id', updateTask);
router.put('/tasks/:id/reassign', reassignTask);
router.get('/reports', getReports);
router.put('/reports/:id/status', updateReportStatus);

module.exports = router;
