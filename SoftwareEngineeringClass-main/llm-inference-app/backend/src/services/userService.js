const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../database/supabaseClient');
const config = require('../config/config');
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
      const existingUsers = await supabase.queryUsers(`email=eq.${email}`);
      
      if (existingUsers && existingUsers.length > 0) {
        const error = new Error('Email already exists');
        error.status = 409;
        throw error;
      }

      // Hash password
      const hashedPassword = await bcryptjs.hash(password, 10);
      
      // Create user
      const newUser = await supabase.insertUser({
        email,
        password_hash: hashedPassword,
        created_at: new Date().toISOString()
      });

      return {
        userId: newUser[0].user_id,
        email: newUser[0].email
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
      const users = await supabase.queryUsers(`email=eq.${email}`);
      
      if (!users || users.length === 0) {
        const error = new Error('Invalid email or password');
        error.status = 401;
        throw error;
      }

      const user = users[0];

      // Verify password
      const isPasswordValid = await bcryptjs.compare(password, user.password_hash);
      if (!isPasswordValid) {
        const error = new Error('Invalid email or password');
        error.status = 401;
        throw error;
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.user_id, email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiration }
      );

      return {
        token,
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
      const users = await supabase.queryUsers(`user_id=eq.${userId}`);

      if (!users || users.length === 0) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
      }

      const user = users[0];
      return {
        userId: user.user_id,
        email: user.email,
        createdAt: user.created_at
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserService;
