const express = require('express');
const { body } = require('express-validator');
const UserController = require('../controllers/userController');
const handleValidationErrors = require('../middleware/errorHandler');

const router = express.Router();

// Get user profile
router.get('/profile', UserController.getProfile);

// Update user profile
router.put(
  '/profile',
  [
    body('firstName')
      .optional()
      .isLength({ min: 2 })
      .withMessage('First name must be at least 2 characters'),
    body('lastName')
      .optional()
      .isLength({ min: 2 })
      .withMessage('Last name must be at least 2 characters')
  ],
  handleValidationErrors,
  UserController.updateProfile
);

// Change password
router.put(
  '/change-password',
  [
    body('oldPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number')
      .matches(/[!@#$%^&*]/)
      .withMessage('Password must contain at least one special character'),
    body('confirmPassword')
      .notEmpty()
      .withMessage('Confirm password is required')
  ],
  handleValidationErrors,
  UserController.changePassword
);

module.exports = router;
