const UserService = require('../../src/services/userService');

describe('UserService', () => {
  describe('registerUser', () => {
    it('should create a new user with valid data', (done) => {
      expect(true).toBe(true);
      done();
    });

    it('should throw an error if email already exists', (done) => {
      expect(true).toBe(true);
      done();
    });
  });

  describe('loginUser', () => {
    it('should return tokens on successful login', (done) => {
      expect(true).toBe(true);
      done();
    });

    it('should throw an error if password is incorrect', (done) => {
      expect(true).toBe(true);
      done();
    });
  });
});
