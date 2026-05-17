const express = require('express');
const router = express.Router();

const {
  createTask,
  getAllTasks,
  getMyTasks,
  updateTaskStatus,
} = require('../controllers/taskController');

const { protect, authorize } = require('../middleware/authMiddleware');

const {
  createTaskValidator,
  updateTaskStatusValidator,
} = require('../validators/taskValidators');



// =====================
// ADMIN ROUTES
// =====================

router.post(
  '/',
  protect,
  authorize('admin'),
  createTaskValidator,
  createTask
);

router.get(
  '/',
  protect,
  authorize('admin'),
  getAllTasks
);



// =====================
// KEBELE STAFF ROUTES
// =====================

router.get(
  '/my-tasks',
  protect,
  authorize('kebele_staff'),
  getMyTasks
);

router.put(
  '/:id/status',
  protect,
  authorize('kebele_staff'),
  updateTaskStatusValidator,
  updateTaskStatus
);

module.exports = router;