/**
 * Validate email format
 */
function isValidEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one number
 * - At least one special character (!@#$%^&*)
 */
function isValidPassword(password) {
    if (!password || typeof password !== 'string') {
        return false;
    }

    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);

    return hasMinLength && hasUppercase && hasNumber && hasSpecial;
}

/**
 * Validate authentication input (email and password)
 * Returns object with isValid boolean and errors array
 */
function validateAuthInput(email, password) {
    const errors = [];

    if (!isValidEmail(email)) {
        errors.push('Invalid email format');
    }

    if (!isValidPassword(password)) {
        errors.push('Password must be at least 8 characters with uppercase, number, and special character');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

module.exports = {
    isValidEmail,
    isValidPassword,
    validateAuthInput
};
