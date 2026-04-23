const userService = require('../src/services/userService');

describe('User Service', () => {
    describe('registerUser', () => {
        it('should register a new user with valid email and password', (done) => {
            const email = 'test_' + Date.now() + '@example.com';
            const password = 'TestPass123!';

            userService.registerUser(email, password)
                .then(result => {
                    expect(result).toBeDefined();
                    expect(result.userId).toBeDefined();
                    expect(result.email).toBe(email);
                    done();
                })
                .catch(error => {
                    fail('Should not reject: ' + error.message);
                    done();
                });
        });

        it('should reject with duplicate email', (done) => {
            const email = 'duplicate_' + Date.now() + '@example.com';
            const password = 'TestPass123!';

            userService.registerUser(email, password)
                .then(() => {
                    return userService.registerUser(email, password);
                })
                .then(() => {
                    fail('Should reject duplicate email');
                    done();
                })
                .catch(error => {
                    expect(error.status).toBe(409);
                    expect(error.message).toContain('already exists');
                    done();
                });
        });

        it('should reject with weak password', (done) => {
            const email = 'test_' + Date.now() + '@example.com';
            const password = 'weak'; // Too short, no uppercase, no number, no special char

            userService.registerUser(email, password)
                .then(() => {
                    fail('Should reject weak password');
                    done();
                })
                .catch(error => {
                    expect(error.status).toBe(400);
                    done();
                });
        });
    });

    describe('loginUser', () => {
        let testEmail;
        let testPassword;

        beforeAll((done) => {
            testEmail = 'login_test_' + Date.now() + '@example.com';
            testPassword = 'LoginTest123!';
            
            userService.registerUser(testEmail, testPassword)
                .then(() => done())
                .catch(error => {
                    fail('Setup failed: ' + error.message);
                    done();
                });
        });

        it('should login user with correct credentials', (done) => {
            userService.loginUser(testEmail, testPassword)
                .then(result => {
                    expect(result).toBeDefined();
                    expect(result.token).toBeDefined();
                    expect(result.user).toBeDefined();
                    expect(result.user.email).toBe(testEmail);
                    done();
                })
                .catch(error => {
                    fail('Should not reject: ' + error.message);
                    done();
                });
        });

        it('should reject with invalid email', (done) => {
            userService.loginUser('nonexistent@example.com', testPassword)
                .then(() => {
                    fail('Should reject invalid email');
                    done();
                })
                .catch(error => {
                    expect(error.status).toBe(401);
                    done();
                });
        });

        it('should reject with wrong password', (done) => {
            userService.loginUser(testEmail, 'WrongPassword123!')
                .then(() => {
                    fail('Should reject wrong password');
                    done();
                })
                .catch(error => {
                    expect(error.status).toBe(401);
                    done();
                });
        });
    });

    describe('getUserProfile', () => {
        let testUserId;

        beforeAll((done) => {
            const email = 'profile_test_' + Date.now() + '@example.com';
            const password = 'ProfileTest123!';
            
            userService.registerUser(email, password)
                .then(result => {
                    testUserId = result.userId;
                    done();
                })
                .catch(error => {
                    fail('Setup failed: ' + error.message);
                    done();
                });
        });

        it('should retrieve user profile by userId', (done) => {
            userService.getUserProfile(testUserId)
                .then(result => {
                    expect(result).toBeDefined();
                    expect(result.userId).toBe(testUserId);
                    expect(result.email).toBeDefined();
                    done();
                })
                .catch(error => {
                    fail('Should not reject: ' + error.message);
                    done();
                });
        });

        it('should reject with invalid userId', (done) => {
            userService.getUserProfile('invalid-uuid')
                .then(() => {
                    fail('Should reject invalid userId');
                    done();
                })
                .catch(error => {
                    expect(error).toBeDefined();
                    done();
                });
        });
    });
});
