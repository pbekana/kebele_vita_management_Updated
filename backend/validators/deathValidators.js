const { body } = require('express-validator');

const createDeathCertificateValidator = [
  body('deceased_resident_id')
    .notEmpty()
    .withMessage('Deceased resident ID is required')
    .isInt()
    .withMessage('Deceased resident ID must be an integer'),

  body('death_date')
    .notEmpty()
    .withMessage('Death date is required')
    .isDate()
    .withMessage('Invalid death date')
    .custom((value) => {
      const deathDate = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      if (deathDate > today) {
        throw new Error('Death date cannot be in the future. Please select a valid date.');
      }
      return true;
    }),

  body('cause_of_death')
    .notEmpty()
    .withMessage('Cause of death is required')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Cause of death must be at least 3 characters'),
];

module.exports = {
  createDeathCertificateValidator,
};
