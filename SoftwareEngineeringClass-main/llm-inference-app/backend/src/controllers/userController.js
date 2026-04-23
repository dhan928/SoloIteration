const { validationResult } = require('express-validator');
const UserService = require('../services/userService');

class UserController {
  /**
   * Get user profile
   */
  static async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      const user = await UserService.getUserProfile(userId);

      return res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: user
      });
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: { code: 'USER_NOT_FOUND' }
        });
      }

      console.error('Get profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: { code: 'GET_PROFILE_ERROR' }
      });
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const { firstName, lastName } = req.body;

      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error',
          errors: errors.array()
        });
      }

      // For now, just return success. In production, implement profile update in database
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          userId,
          firstName,
          lastName
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: { code: 'UPDATE_PROFILE_ERROR' }
      });
    }
  }

  /**
   * Change password
   */
  static async changePassword(req, res) {
    try {
      const userId = req.user.userId;
      const { oldPassword, newPassword, confirmPassword } = req.body;

      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error',
          errors: errors.array()
        });
      }

      // Check password match
      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'New passwords do not match'
        });
      }

      await UserService.changePassword(userId, oldPassword, newPassword);

      return res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      if (error.message === 'Invalid current password') {
        return res.status(401).json({
          success: false,
          message: 'Invalid current password',
          error: { code: 'INVALID_PASSWORD' }
        });
      }

      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: { code: 'USER_NOT_FOUND' }
        });
      }

      console.error('Change password error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: { code: 'CHANGE_PASSWORD_ERROR' }
      });
    }
  }
}

module.exports = UserController;
