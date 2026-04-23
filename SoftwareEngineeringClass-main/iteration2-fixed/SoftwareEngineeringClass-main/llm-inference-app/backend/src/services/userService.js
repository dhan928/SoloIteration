const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const FileStore = require('../database/fileStore');
const config = require('../config/config');
const { isValidEmail, isValidPassword } = require('../utils/validators');

class UserService {
  static async registerUser(email, password) {
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

    const existingUser = await FileStore.findUserByEmail(email);
    if (existingUser) {
      const error = new Error('Email already exists');
      error.status = 409;
      throw error;
    }

    const password_hash = await bcryptjs.hash(password, 10);
    const newUser = await FileStore.createUser({ email, password_hash });

    return {
      userId: newUser.user_id,
      email: newUser.email
    };
  }

  static async loginUser(email, password) {
    if (!isValidEmail(email)) {
      const error = new Error('Invalid email format');
      error.status = 400;
      throw error;
    }

    const user = await FileStore.findUserByEmail(email);
    if (!user) {
      const error = new Error('Invalid email or password');
      error.status = 401;
      throw error;
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password_hash);
    if (!isPasswordValid) {
      const error = new Error('Invalid email or password');
      error.status = 401;
      throw error;
    }

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
  }

  static async getUserProfile(userId) {
    const user = await FileStore.findUserById(userId);
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
  }


  static async changePassword(userId, oldPassword, newPassword) {
    const user = await FileStore.findUserById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    const ok = await bcryptjs.compare(oldPassword, user.password_hash);
    if (!ok) {
      const error = new Error('Invalid current password');
      error.status = 401;
      throw error;
    }

    if (!isValidPassword(newPassword)) {
      const error = new Error('Password does not meet requirements');
      error.status = 400;
      throw error;
    }

    const password_hash = await bcryptjs.hash(newPassword, 10);
    const fs = require('fs');
    const path = require('path');
    const dbFile = path.join(__dirname, '..', '..', 'data', 'db.json');
    const db = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    const target = db.users.find((u) => u.user_id === userId);
    target.password_hash = password_hash;
    fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
    return { success: true };
  }

  static async logoutUser() {
    return { success: true };
  }
}


module.exports = UserService;
