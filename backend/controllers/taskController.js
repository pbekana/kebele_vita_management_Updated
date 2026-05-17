const { validationResult } = require('express-validator');
const { pool } = require('../config/connectDB');
const logger = require('../utils/logger');

/**
 * Validation error handler
 */
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      errors: errors.array(),
    });

    return true;
  }

  return false;
};

/**
 * Generic server error
 */
const serverError = (
  res,
  err,
  message = 'Internal server error'
) => {
  logger.error(err);

  return res.status(500).json({
    error: message,
  });
};

/**
 * POST /api/tasks
 * Admin creates task
 */
const createTask = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const {
    title,
    description,
    task_type,
    assigned_to,
    assigned_by,
    resident_id,
    status,
    due_date,
  } = req.body;

  try {
    // Check assigned user
    const [users] = await pool.query(
      `SELECT id, role
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [assigned_to]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: 'Assigned staff not found',
      });
    }

    const staff = users[0];

    if (staff.role !== 'kebele_staff') {
      return res.status(400).json({
        error: 'Task can only be assigned to kebele staff',
      });
    }

    // Create task
    const [result] = await pool.query(
      `INSERT INTO tasks
      (
        title,
        description,
        task_type,
        assigned_to,
        assigned_by,
        resident_id,
        status,
        due_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        task_type,
        assigned_to,
        req.user.id,
        resident_id || null,
        status || 'pending',
        due_date || null,
      ]
    );

    logger.info(
      `Admin ${req.user.id} assigned task ${result.insertId}`
    );

    return res.status(201).json({
      message: 'Task assigned successfully',
      task_id: result.insertId,
    });

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * GET /api/tasks
 * Admin gets all tasks
 */
const getAllTasks = async (req, res) => {
  try {
    const [tasks] = await pool.query(
      `SELECT
        t.id,
        t.title,
        t.task_type,
        t.status,
        t.due_date,
        t.assigned_to,
        assigned.email AS assigned_staff_email,
        ks.position AS assigned_staff_position,
        admin.email AS assigned_by_email
      FROM tasks t
      INNER JOIN users assigned ON t.assigned_to = assigned.id
      LEFT JOIN kebele_staff ks ON assigned.id = ks.user_id
      INNER JOIN users admin ON t.assigned_by = admin.id
      ORDER BY t.created_at DESC`
    );

    return res.status(200).json({
      count: tasks.length,
      tasks,
    });

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * GET /api/tasks/my-tasks
 * Kebele staff gets assigned tasks
 */
const getMyTasks = async (req, res) => {
  try {
    const [tasks] = await pool.query(
      `SELECT *
       FROM tasks
       WHERE assigned_to = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      count: tasks.length,
      tasks,
    });

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * PUT /api/tasks/:id/status
 * Staff updates task status
 */
const updateTaskStatus = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const taskId = Number(req.params.id);

  if (!Number.isInteger(taskId)) {
    return res.status(400).json({
      error: 'Invalid task ID',
    });
  }

  const {
    status,
  } = req.body;

  try {
    const [tasks] = await pool.query(
      `SELECT *
       FROM tasks
       WHERE id = ?
       LIMIT 1`,
      [taskId]
    );

    if (tasks.length === 0) {
      return res.status(404).json({
        error: 'Task not found',
      });
    }

    const task = tasks[0];

    // Ensure staff owns task
    if (task.assigned_to !== req.user.id) {
      return res.status(403).json({
        error: 'You are not assigned to this task',
      });
    }

    let completedAt = null;

    if (status === 'completed') {
      completedAt = new Date();
    }

    await pool.query(
      `UPDATE tasks
       SET
         status = ?,
         completed_at = ?
       WHERE id = ?`,
      [
        status,
        completedAt,
        taskId,
      ]
    );

    logger.info(
      `Task ${taskId} updated to ${status} by staff ${req.user.id}`
    );

    return res.status(200).json({
      message: 'Task updated successfully',
    });

  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * PUT /api/admin/tasks/:id/assign
 * Admin reassigns task
 */
const reassignTask = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const taskId = Number(req.params.id);

  if (!Number.isInteger(taskId)) {
    return res.status(400).json({
      error: 'Invalid task ID',
    });
  }

  const { assigned_to } = req.body;

  try {
    // Check if task exists
    const [tasks] = await pool.query(
      `SELECT * FROM tasks WHERE id = ? LIMIT 1`,
      [taskId]
    );

    if (tasks.length === 0) {
      return res.status(404).json({
        error: 'Task not found',
      });
    }

    // Check assigned user
    const [users] = await pool.query(
      `SELECT id, role FROM users WHERE id = ? LIMIT 1`,
      [assigned_to]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: 'Assigned staff not found',
      });
    }

    const staff = users[0];

    if (staff.role !== 'kebele_staff') {
      return res.status(400).json({
        error: 'Task can only be assigned to kebele staff',
      });
    }

    await pool.query(
      `UPDATE tasks
       SET assigned_to = ?
       WHERE id = ?`,
      [assigned_to, taskId]
    );

    logger.info(
      `Admin ${req.user.id} reassigned task ${taskId} to user ${assigned_to}`
    );

    return res.status(200).json({
      message: 'Task reassigned successfully',
    });

  } catch (err) {
    return serverError(res, err);
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getMyTasks,
  updateTaskStatus,
  reassignTask,
};