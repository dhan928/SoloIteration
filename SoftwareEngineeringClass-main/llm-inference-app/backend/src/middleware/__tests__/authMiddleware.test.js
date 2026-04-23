// Unit tests for authentication middleware

const jwt = require('jsonwebtoken');
const config = require('../config/config');

describe('Auth Middleware', () => {
  let mockRequest;
  let mockResponse;
  let mockNext;

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  const verifyToken = (token) => {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  };

  const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Missing authorization header',
        error: { code: 'NO_AUTH_HEADER' }
      });
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization scheme',
        error: { code: 'INVALID_SCHEME' }
      });
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Missing token',
        error: { code: 'NO_TOKEN' }
      });
    }

    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: { code: 'INVALID_TOKEN' }
      });
    }
  };

  // ==========================================
  // SUCCESSFUL AUTHENTICATION TESTS
  // ==========================================

  describe('Successful Authentication', () => {
    test('should allow request with valid Bearer token', () => {
      const token = jwt.sign(
        { userId: 'uuid-123', email: 'user@example.com' },
        config.jwt.secret,
        { expiresIn: '24h' }
      );

      mockRequest.headers.authorization = `Bearer ${token}`;

      authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toHaveProperty('userId');
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test('should extract user data from valid token', () => {
      const userData = { userId: 'uuid-123', email: 'user@example.com' };
      const token = jwt.sign(userData, config.jwt.secret, { expiresIn: '24h' });

      mockRequest.headers.authorization = `Bearer ${token}`;

      authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockRequest.user.userId).toBe(userData.userId);
      expect(mockRequest.user.email).toBe(userData.email);
    });
  });

  // ==========================================
  // MISSING AUTHORIZATION TESTS
  // ==========================================

  describe('Missing Authorization', () => {
    test('should reject request without authorization header', () => {
      mockRequest.headers.authorization = undefined;

      authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'NO_AUTH_HEADER' })
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject request with empty authorization header', () => {
      mockRequest.headers.authorization = '';

      authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // INVALID SCHEME TESTS
  // ==========================================

  describe('Invalid Authorization Scheme', () => {
    test('should reject request with wrong authorization scheme', () => {
      mockRequest.headers.authorization = 'Basic token123';

      authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: 'INVALID_SCHEME' })
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject request with Bearer but no token', () => {
      mockRequest.headers.authorization = 'Bearer';

      authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // INVALID TOKEN TESTS
  // ==========================================

  describe('Invalid Token', () => {
    test('should reject request with malformed token', () => {
      mockRequest.headers.authorization = 'Bearer invalid.token.format';

      authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: 'INVALID_TOKEN' })
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject request with token signed with wrong secret', () => {
      const token = jwt.sign(
        { userId: 'uuid-123' },
        'wrong-secret',
        { expiresIn: '24h' }
      );

      mockRequest.headers.authorization = `Bearer ${token}`;

      authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject request with expired token', (done) => {
      // Create token that expires immediately
      const token = jwt.sign(
        { userId: 'uuid-123' },
        config.jwt.secret,
        { expiresIn: '0s' }
      );

      // Wait a bit to ensure token is expired
      setTimeout(() => {
        mockRequest.headers.authorization = `Bearer ${token}`;

        authMiddleware(mockRequest, mockResponse, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
        done();
      }, 100);
    });
  });
});
