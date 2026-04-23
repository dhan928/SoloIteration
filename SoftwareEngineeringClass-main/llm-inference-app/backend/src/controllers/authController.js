const { body, validationResult } = require('express-validator');
const UserService = require('../services/userService');

class AuthController {
  /**
   * Register user
   */
  static async register(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error',
          errors: errors.array()
        });
      }

      // Register user
      const user = await UserService.registerUser(email, password);

      return res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: user
      });
    } catch (error) {
      if (error.message === 'Email already exists') {
        return res.status(409).json({
          success: false,
          message: 'Email already exists',
          error: { code: 'EMAIL_EXISTS' }
        });
      }

      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: { code: 'REGISTRATION_ERROR', details: error.message }
      });
    }
  }

  /**
   * Login user
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error',
          errors: errors.array()
        });
      }

      // Login user
      const result = await UserService.loginUser(email, password);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: { code: 'USER_NOT_FOUND' }
        });
      }

      if (error.message === 'Invalid password') {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          error: { code: 'INVALID_CREDENTIALS' }
        });
      }

      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: { code: 'LOGIN_ERROR' }
      });
    }
  }

  /**
   * Logout user
   */
  static async logout(req, res) {
    try {
      const userId = req.user.userId;

      await UserService.logoutUser(userId);

      return res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: { code: 'LOGOUT_ERROR' }
      });
    }
  }
}

module.exports = AuthController;
