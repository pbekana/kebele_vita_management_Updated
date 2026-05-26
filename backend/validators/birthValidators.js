const { body } = require('express-validator');

const createBirthCertificateValidator = [
  body('child_name')
    .notEmpty()
    .withMessage('Child name is required')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Child name must be at least 2 characters'),

  body('birth_place')
    .notEmpty()
    .withMessage('Birth place is required')
    .trim(),

  body('birth_date')
    .notEmpty()
    .withMessage('Birth date is required')
    .isDate()
    .withMessage('Invalid birth date'),

  body('target_child_id')
    .notEmpty()
    .withMessage('Target child ID is required')
    .isInt()
    .withMessage('Target child ID must be an integer'),
];

module.exports = {
  createBirthCertificateValidator,
};
