// Unit tests for validation utilities

describe('Email Validation', () => {
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  test('should accept valid email addresses', () => {
    const validEmails = [
      'user@example.com',
      'test.user@domain.co.uk',
      'user+tag@example.com',
      'user_123@test-domain.org'
    ];

    validEmails.forEach(email => {
      expect(isValidEmail(email)).toBe(true);
    });
  });

  test('should reject invalid email addresses', () => {
    const invalidEmails = [
      'notanemail',
      'user@',
      '@example.com',
      'user@.com',
      'user @example.com',
      'user@example'
    ];

    invalidEmails.forEach(email => {
      expect(isValidEmail(email)).toBe(false);
    });
  });
});

describe('Password Validation', () => {
  const validatePassword = (password) => {
    const isLengthValid = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);

    return {
      isValid: isLengthValid && hasUppercase && hasNumber && hasSpecial,
      isLengthValid,
      hasUppercase,
      hasNumber,
      hasSpecial
    };
  };

  test('should accept strong passwords', () => {
    const strongPasswords = [
      'SecurePass123!',
      'MyPassword@456',
      'Test!Pass789',
      'Secure#123Password'
    ];

    strongPasswords.forEach(password => {
      const validation = validatePassword(password);
      expect(validation.isValid).toBe(true);
    });
  });

  test('should reject password with insufficient length', () => {
    const password = 'Short1!';
    const validation = validatePassword(password);

    expect(validation.isValid).toBe(false);
    expect(validation.isLengthValid).toBe(false);
  });

  test('should reject password without uppercase', () => {
    const password = 'lowercase123!';
    const validation = validatePassword(password);

    expect(validation.isValid).toBe(false);
    expect(validation.hasUppercase).toBe(false);
  });

  test('should reject password without number', () => {
    const password = 'NoNumber!';
    const validation = validatePassword(password);

    expect(validation.isValid).toBe(false);
    expect(validation.hasNumber).toBe(false);
  });

  test('should reject password without special character', () => {
    const password = 'NoSpecial123';
    const validation = validatePassword(password);

    expect(validation.isValid).toBe(false);
    expect(validation.hasSpecial).toBe(false);
  });

  test('should provide detailed validation feedback', () => {
    const password = 'weakpass';
    const validation = validatePassword(password);

    expect(validation).toEqual({
      isValid: false,
      isLengthValid: true,
      hasUppercase: false,
      hasNumber: false,
      hasSpecial: false
    });
  });
});
