// ===========================
// Configuration
// ===========================

const API_HOST =
    window.location.hostname === '127.0.0.1'
        ? '127.0.0.1'
        : window.location.hostname || 'localhost';
const API_BASE_URL = `${window.location.protocol}//${API_HOST}:3000/api/v1`;
const API_TIMEOUT = 10000; // 10 seconds

// ===========================
// Utility Functions
// ===========================

/**
 * Make API call with authentication
 */
async function apiCall(endpoint, options = {}) {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    if (user && user.userId) {
        headers['X-User-Id'] = user.userId;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
            signal: controller.signal
        });

        const data = await response.json();

        if (!response.ok) {
            throw {
                status: response.status,
                data
            };
        }

        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw {
                status: 408,
                data: { message: 'Request timed out. Please check that the backend is running.' }
            };
        }
        if (!error.status) {
            throw {
                status: 0,
                data: {
                    message:
                        'Could not reach the backend. Make sure the backend server is running on port 3000 and then refresh the page.'
                }
            };
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength
 */
function validatePassword(password) {
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
}

/**
 * Show error message
 */
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.add('show');
    }
}

/**
 * Hide error message
 */
function hideError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = '';
        element.classList.remove('show');
    }
}

/**
 * Show success message
 */
function showSuccess(message) {
    const element = document.getElementById('successMessage');
    if (element) {
        element.textContent = message;
        element.classList.add('show');
    }
}

/**
 * Clear all messages
 */
function clearMessages() {
    const successElement = document.getElementById('successMessage');
    const errorElement = document.getElementById('generalError');
    
    if (successElement) {
        successElement.textContent = '';
        successElement.classList.remove('show');
    }
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }
}

/**
 * Clear all field errors
 */
function clearFieldErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.textContent = '';
        element.classList.remove('show');
    });
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return !!localStorage.getItem('user');
}

/**
 * Redirect to login if not authenticated
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
    }
}

/**
 * Logout user
 */
function logoutUser() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

// ===========================
// Export Functions
// ===========================

window.apiCall = apiCall;
window.isValidEmail = isValidEmail;
window.validatePassword = validatePassword;
window.showError = showError;
window.hideError = hideError;
window.showSuccess = showSuccess;
window.clearMessages = clearMessages;
window.clearFieldErrors = clearFieldErrors;
window.isAuthenticated = isAuthenticated;
window.requireAuth = requireAuth;
window.logoutUser = logoutUser;
