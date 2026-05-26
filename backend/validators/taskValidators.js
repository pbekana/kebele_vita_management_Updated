const { body } = require('express-validator');

const createTaskValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required'),

  body('task_type')
    .isIn([
      'id_card',
      'birth_certificate',
      'death_certificate',
      'marriage_certificate',
      'issue_report',
      'other',
    ])
    .withMessage('Invalid task type'),

  body('assigned_to')
    .isInt()
    .withMessage('Assigned staff ID must be integer'),

  body('priority')
    .optional()
    .isIn([
      'low',
      'medium',
      'high',
      'urgent',
    ]),

  body('due_date')
    .optional()
    .isDate()
    .withMessage('Invalid due date')
    .custom((value) => {
      if (value) {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          throw new Error('Task date cannot be earlier than today. Please select today or a future date.');
        }
      }
      return true;
    }),
];

const updateTaskStatusValidator = [
  body('status')
    .isIn([
      'in_progress',
      'completed',
      'cancelled',
    ])
    .withMessage('Invalid status'),
];

module.exports = {
  createTaskValidator,
  updateTaskStatusValidator,
};