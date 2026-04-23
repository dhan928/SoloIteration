const { isValidEmail, isValidPassword, validateAuthInput } = require('../src/utils/validators');

describe('Validators', () => {
    describe('isValidEmail', () => {
        it('should accept valid email addresses', () => {
            expect(isValidEmail('test@example.com')).toBe(true);
            expect(isValidEmail('user.name@subdomain.example.co.uk')).toBe(true);
            expect(isValidEmail('dh959@scarletmail.rutgers.edu')).toBe(true);
        });

        it('should reject invalid email addresses', () => {
            expect(isValidEmail('invalid')).toBe(false);
            expect(isValidEmail('invalid@')).toBe(false);
            expect(isValidEmail('@example.com')).toBe(false);
            expect(isValidEmail('invalid@.com')).toBe(false);
            expect(isValidEmail('')).toBe(false);
        });

        it('should reject null or undefined', () => {
            expect(isValidEmail(null)).toBe(false);
            expect(isValidEmail(undefined)).toBe(false);
        });
    });

    describe('isValidPassword', () => {
        it('should accept valid passwords', () => {
            expect(isValidPassword('ValidPass123!')).toBe(true);
            expect(isValidPassword('MyPassword456@')).toBe(true);
            expect(isValidPassword('SecurePass789#')).toBe(true);
        });

        it('should reject passwords without uppercase', () => {
            expect(isValidPassword('validpass123!')).toBe(false);
        });

        it('should reject passwords without number', () => {
            expect(isValidPassword('ValidPassword!')).toBe(false);
        });

        it('should reject passwords without special character', () => {
            expect(isValidPassword('ValidPass123')).toBe(false);
        });

        it('should reject passwords shorter than 8 characters', () => {
            expect(isValidPassword('Pass1!')).toBe(false);
            expect(isValidPassword('Pass12!D')).toBe(true);
        });

        it('should reject null or undefined', () => {
            expect(isValidPassword(null)).toBe(false);
            expect(isValidPassword(undefined)).toBe(false);
        });
    });

    describe('validateAuthInput', () => {
        it('should pass valid auth input', () => {
            const result = validateAuthInput('test@example.com', 'ValidPass123!');
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it('should return error for invalid email', () => {
            const result = validateAuthInput('invalid-email', 'ValidPass123!');
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(e => e.includes('email'))).toBe(true);
        });

        it('should return error for weak password', () => {
            const result = validateAuthInput('test@example.com', 'weak');
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(e => e.toLowerCase().includes('password'))).toBe(true);
        });

        it('should return multiple errors for invalid input', () => {
            const result = validateAuthInput('invalid', 'weak');
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
        });
    });
});
