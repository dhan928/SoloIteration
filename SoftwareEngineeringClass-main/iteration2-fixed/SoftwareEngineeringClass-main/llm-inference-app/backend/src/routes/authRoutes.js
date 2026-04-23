const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const handleValidationErrors = require('../middleware/errorHandler');

const router = express.Router();

// Registration endpoint
router.post(
  '/register',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number')
      .matches(/[!@#$%^&*]/)
      .withMessage('Password must contain at least one special character')
  ],
  handleValidationErrors,
  AuthController.register
);

// Login endpoint
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  handleValidationErrors,
  AuthController.login
);

// Logout endpoint (requires authentication)
router.post('/logout', AuthController.logout);

module.exports = router;
