// Unit tests for userService
// Tests user registration, login, and profile retrieval

const userService = require('../src/services/userService');
const supabaseClient = require('../src/database/supabaseClient');

// Mock Supabase client
jest.mock('../src/database/supabaseClient');

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // USER REGISTRATION TESTS
  // ==========================================

  describe('registerUser', () => {
    test('should successfully register a new user with valid email and password', async () => {
      const email = 'newuser@example.com';
      const password = 'SecurePass123!';

      // Mock Supabase response
      supabaseClient.queryUsers.mockResolvedValue([]);
      supabaseClient.insertUser.mockResolvedValue({
        user_id: 'uuid-123',
        email: email,
        created_at: new Date().toISOString()
      });

      const result = await userService.registerUser(email, password);

      expect(result).toHaveProperty('user_id');
      expect(result.email).toBe(email);
      expect(supabaseClient.queryUsers).toHaveBeenCalledWith('email', email);
      expect(supabaseClient.insertUser).toHaveBeenCalled();
    });

    test('should throw error if email already exists', async () => {
      const email = 'existing@example.com';
      const password = 'SecurePass123!';

      // Mock existing user
      supabaseClient.queryUsers.mockResolvedValue([{ email }]);

      await expect(userService.registerUser(email, password)).rejects.toThrow(
        'Email already exists'
      );
    });

    test('should hash password before storing', async () => {
      const email = 'newuser@example.com';
      const password = 'SecurePass123!';

      supabaseClient.queryUsers.mockResolvedValue([]);
      supabaseClient.insertUser.mockImplementation((data) => {
        // Verify password is hashed
        expect(data.password_hash).not.toBe(password);
        expect(data.password_hash).toMatch(/^\$2[aby]\$.{56}$/); // Bcrypt hash pattern
        return Promise.resolve({
          user_id: 'uuid-123',
          email: email
        });
      });

      await userService.registerUser(email, password);

      expect(supabaseClient.insertUser).toHaveBeenCalled();
    });

    test('should reject password with insufficient length', async () => {
      const email = 'newuser@example.com';
      const password = 'Short1!'; // Only 7 chars

      supabaseClient.queryUsers.mockResolvedValue([]);

      await expect(userService.registerUser(email, password)).rejects.toThrow(
        'Password must contain at least 8 characters'
      );
    });

    test('should reject password without uppercase letter', async () => {
      const email = 'newuser@example.com';
      const password = 'lowercase123!'; // No uppercase

      supabaseClient.queryUsers.mockResolvedValue([]);

      await expect(userService.registerUser(email, password)).rejects.toThrow(
        'Password must contain at least one uppercase letter'
      );
    });

    test('should reject password without number', async () => {
      const email = 'newuser@example.com';
      const password = 'NoNumber!'; // No number

      supabaseClient.queryUsers.mockResolvedValue([]);

      await expect(userService.registerUser(email, password)).rejects.toThrow(
        'Password must contain at least one number'
      );
    });

    test('should reject password without special character', async () => {
      const email = 'newuser@example.com';
      const password = 'NoSpecial123'; // No special char

      supabaseClient.queryUsers.mockResolvedValue([]);

      await expect(userService.registerUser(email, password)).rejects.toThrow(
        'Password must contain at least one special character'
      );
    });
  });

  // ==========================================
  // USER LOGIN TESTS
  // ==========================================

  describe('loginUser', () => {
    test('should successfully login user with correct credentials', async () => {
      const email = 'user@example.com';
      const password = 'SecurePass123!';
      const hashedPassword = '$2b$10$N9qo8uLOickgx2ZMRZoMyesn...';

      // Mock user found in database
      supabaseClient.queryUsers.mockResolvedValue([{
        user_id: 'uuid-123',
        email: email,
        password_hash: hashedPassword
      }]);

      const result = await userService.loginUser(email, password);

      expect(result).toHaveProperty('user_id');
      expect(result.email).toBe(email);
      expect(supabaseClient.queryUsers).toHaveBeenCalledWith('email', email);
    });

    test('should throw error if user not found', async () => {
      const email = 'notfound@example.com';
      const password = 'SecurePass123!';

      // Mock user not found
      supabaseClient.queryUsers.mockResolvedValue([]);

      await expect(userService.loginUser(email, password)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    test('should throw error if password is incorrect', async () => {
      const email = 'user@example.com';
      const wrongPassword = 'WrongPass123!';

      supabaseClient.queryUsers.mockResolvedValue([{
        user_id: 'uuid-123',
        email: email,
        password_hash: '$2b$10$N9qo8uLOickgx2ZMRZoMyesn...'
      }]);

      await expect(userService.loginUser(email, wrongPassword)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    test('should not return password_hash in result', async () => {
      const email = 'user@example.com';
      const password = 'SecurePass123!';

      supabaseClient.queryUsers.mockResolvedValue([{
        user_id: 'uuid-123',
        email: email,
        password_hash: '$2b$10$N9qo8uLOickgx2ZMRZoMyesn...'
      }]);

      const result = await userService.loginUser(email, password);

      expect(result).not.toHaveProperty('password_hash');
      expect(result).toEqual({
        user_id: 'uuid-123',
        email: email
      });
    });
  });

  // ==========================================
  // GET USER PROFILE TESTS
  // ==========================================

  describe('getUserProfile', () => {
    test('should retrieve user profile by user_id', async () => {
      const userId = 'uuid-123';

      supabaseClient.queryUsers.mockResolvedValue([{
        user_id: userId,
        email: 'user@example.com',
        created_at: '2026-03-16T10:30:00Z'
      }]);

      const result = await userService.getUserProfile(userId);

      expect(result).toHaveProperty('user_id', userId);
      expect(result).toHaveProperty('email');
      expect(result).not.toHaveProperty('password_hash');
      expect(supabaseClient.queryUsers).toHaveBeenCalledWith('user_id', userId);
    });

    test('should throw error if user not found', async () => {
      const userId = 'nonexistent-uuid';

      supabaseClient.queryUsers.mockResolvedValue([]);

      await expect(userService.getUserProfile(userId)).rejects.toThrow(
        'User not found'
      );
    });

    test('should not include password_hash in response', async () => {
      const userId = 'uuid-123';

      supabaseClient.queryUsers.mockResolvedValue([{
        user_id: userId,
        email: 'user@example.com',
        password_hash: '$2b$10$...',
        created_at: '2026-03-16T10:30:00Z'
      }]);

      const result = await userService.getUserProfile(userId);

      expect(result.password_hash).toBeUndefined();
    });
  });
});
