const { validationResult } = require('express-validator');
const UserService = require('../services/userService');

class AuthController {
  static async register(req, res) {
    try {
      const { email, password } = req.body;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation Error', errors: errors.array() });
      }

      const user = await UserService.registerUser(email, password);
      return res.status(201).json({ success: true, message: 'Account created successfully', data: user });
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ success: false, message: error.message || 'Internal server error' });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation Error', errors: errors.array() });
      }

      const result = await UserService.loginUser(email, password);
      return res.status(200).json({ success: true, message: 'Login successful', data: result });
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ success: false, message: error.message || 'Internal server error' });
    }
  }

  static async logout(req, res) {
    await UserService.logoutUser(req.user?.userId);
    return res.status(200).json({ success: true, message: 'Logout successful' });
  }
}

module.exports = AuthController;
