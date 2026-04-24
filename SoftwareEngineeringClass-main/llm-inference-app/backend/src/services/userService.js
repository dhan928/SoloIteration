const bcryptjs = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/sqliteClient');
const { isValidEmail, isValidPassword } = require('../utils/validators');

class UserService {
  /**
   * Register a new user
   */
  static async registerUser(email, password) {
    try {
      // Validate input
      if (!isValidEmail(email)) {
        const error = new Error('Invalid email format');
        error.status = 400;
        throw error;
      }

      if (!isValidPassword(password)) {
        const error = new Error('Password does not meet requirements');
        error.status = 400;
        throw error;
      }

      // Check if user already exists
      const existingUser = await db.findUserByEmail(email);
      
      if (existingUser) {
        const error = new Error('Email already exists');
        error.status = 409;
        throw error;
      }

      // Hash password
      const hashedPassword = await bcryptjs.hash(password, 10);
      
      // Create user
      const newUser = await db.createUser({
        userId: uuidv4(),
        email,
        passwordHash: hashedPassword,
        createdAt: new Date().toISOString()
      });

      return {
        userId: newUser.user_id,
        email: newUser.email
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login user
   */
  static async loginUser(email, password) {
    try {
      // Validate input
      if (!isValidEmail(email)) {
        const error = new Error('Invalid email format');
        error.status = 400;
        throw error;
      }

      // Find user by email
      const user = await db.findUserByEmail(email);

      if (!user) {
        const error = new Error('Invalid email or password');
        error.status = 401;
        throw error;
      }

      // Verify password
      const isPasswordValid = await bcryptjs.compare(password, user.password_hash);
      if (!isPasswordValid) {
        const error = new Error('Invalid email or password');
        error.status = 401;
        throw error;
      }

      return {
        user: {
          userId: user.user_id,
          email: user.email
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user profile
   */
  static async getUserProfile(userId) {
    try {
      const user = await db.findUserById(userId);

      if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
      }

      return {
        userId: user.user_id,
        email: user.email,
        createdAt: user.created_at
      };
    } catch (error) {
      throw error;
    }
  }

  static async changePassword(userId, oldPassword, newPassword) {
    const user = await db.findUserById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    const matches = await bcryptjs.compare(oldPassword, user.password_hash);
    if (!matches) {
      const error = new Error('Invalid current password');
      error.status = 401;
      throw error;
    }

    if (!isValidPassword(newPassword)) {
      const error = new Error('Password does not meet requirements');
      error.status = 400;
      throw error;
    }

    const passwordHash = await bcryptjs.hash(newPassword, 10);
    await db.updateUserPassword(userId, passwordHash);
    return { success: true };
  }

  static async logoutUser() {
    return { success: true };
  }
}

module.exports = UserService;
