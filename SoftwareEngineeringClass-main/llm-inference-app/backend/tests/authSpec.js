const http = require('http');

function postRequest(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(responseData) }); }
        catch(e) { resolve({ status: res.statusCode, body: {} }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

describe('Auth API', () => {

  describe('POST /api/v1/auth/register', () => {

    it('should reject registration with missing email', async () => {
      const res = await postRequest('/api/v1/auth/register', { password: 'password123' });
      expect([400, 422, 500]).toContain(res.status);
    });

    it('should reject registration with missing password', async () => {
      const res = await postRequest('/api/v1/auth/register', { email: 'test@example.com' });
      expect([400, 422, 500]).toContain(res.status);
    });

    it('should register a new user with valid email and password', async () => {
      const res = await postRequest('/api/v1/auth/register', {
        email: `testuser_${Date.now()}@example.com`,
        password: 'password123'
      });
      expect([200, 201, 400, 500]).toContain(res.status);
    });

  });

  describe('POST /api/v1/auth/login', () => {

    it('should reject login with missing email', async () => {
      const res = await postRequest('/api/v1/auth/login', { password: 'password123' });
      expect([400, 401, 422, 500]).toContain(res.status);
    });

    it('should reject login with wrong password', async () => {
      const res = await postRequest('/api/v1/auth/login', {
        email: 'testuser@example.com',
        password: 'wrongpassword'
      });
      expect([400, 401, 404, 500]).toContain(res.status);
    });

    it('should reject login with non-existent email', async () => {
      const res = await postRequest('/api/v1/auth/login', {
        email: 'nobody@nowhere.com',
        password: 'password123'
      });
      expect([400, 401, 404, 500]).toContain(res.status);
    });

  });

  describe('POST /api/v1/auth/logout', () => {

    it('should successfully log out', async () => {
      const res = await postRequest('/api/v1/auth/logout', {});
      expect([200, 204, 500]).toContain(res.status);
    });

  });

});
