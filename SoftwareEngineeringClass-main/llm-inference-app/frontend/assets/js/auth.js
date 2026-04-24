// ===========================
// Authentication Functions
// ===========================

/**
 * Handle login form submission
 */
async function handleLogin(event) {
    event.preventDefault();
    clearFieldErrors();
    clearMessages();
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Validate input
    if (!email || !password) {
        showError('generalError', 'Please fill in all fields');
        return;
    }

    if (!isValidEmail(email)) {
        showError('emailError', 'Please enter a valid email');
        return;
    }

    try {
        // Show loading state
        if (submitBtn) {
            submitBtn.textContent = 'Logging in...';
            submitBtn.disabled = true;
        }

        // Make API call
        const response = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (response.success) {
            localStorage.setItem('user', JSON.stringify(response.data.user));

            // Show success message and redirect
            showSuccess('Login successful! Redirecting...');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        }
    } catch (error) {
        if (error.data && error.data.message) {
            showError('generalError', error.data.message);
        } else {
            showError('generalError', 'Login failed. Please try again.');
        }
    } finally {
        if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
}

/**
 * Handle signup form submission
 */
async function handleSignup(event) {
    event.preventDefault();
    clearFieldErrors();
    clearMessages();
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Validate input
    if (!email || !password) {
        showError('generalError', 'Please fill in all fields');
        return;
    }

    if (!isValidEmail(email)) {
        showError('emailError', 'Please enter a valid email');
        return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
        let errors = [];
        if (!passwordValidation.isLengthValid) errors.push('at least 8 characters');
        if (!passwordValidation.hasUppercase) errors.push('one uppercase letter');
        if (!passwordValidation.hasNumber) errors.push('one number');
        if (!passwordValidation.hasSpecial) errors.push('one special character');
        showError('passwordError', 'Password must contain ' + errors.join(', '));
        return;
    }

    try {
        // Show loading state
        if (submitBtn) {
            submitBtn.textContent = 'Creating account...';
            submitBtn.disabled = true;
        }

        // Make API call
        const response = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email,
                password
            })
        });

        if (response.success) {
            // Auto-login after signup
            try {
                const loginResponse = await apiCall('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });

                if (loginResponse.success) {
                    localStorage.setItem('user', JSON.stringify(loginResponse.data.user));

                    // Show success and redirect to dashboard
                    showSuccess('Account created! Redirecting to dashboard...');
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                }
            } catch (loginError) {
                // If auto-login fails, redirect to login page
                showSuccess('Account created successfully! Please log in...');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            }
        }
    } catch (error) {
        if (error.status === 409) {
            showError('emailError', 'Email already exists');
        } else if (error.data && error.data.message) {
            showError('generalError', error.data.message);
        } else {
            showError('generalError', 'Failed to create account. Please try again.');
        }
    } finally {
        if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
}
/**
 * Update password requirements display
 */
function updatePasswordRequirements(password) {
    const validation = validatePassword(password);

    const lengthEl = document.getElementById('req-length');
    const uppercaseEl = document.getElementById('req-uppercase');
    const numberEl = document.getElementById('req-number');
    const specialEl = document.getElementById('req-special');

    if (lengthEl) {
        if (validation.isLengthValid) {
            lengthEl.textContent = '✓ At least 8 characters';
            lengthEl.classList.add('valid');
        } else {
            lengthEl.textContent = '✗ At least 8 characters';
            lengthEl.classList.remove('valid');
        }
    }

    if (uppercaseEl) {
        if (validation.hasUppercase) {
            uppercaseEl.textContent = '✓ One uppercase letter';
            uppercaseEl.classList.add('valid');
        } else {
            uppercaseEl.textContent = '✗ One uppercase letter';
            uppercaseEl.classList.remove('valid');
        }
    }

    if (numberEl) {
        if (validation.hasNumber) {
            numberEl.textContent = '✓ One number';
            numberEl.classList.add('valid');
        } else {
            numberEl.textContent = '✗ One number';
            numberEl.classList.remove('valid');
        }
    }

    if (specialEl) {
        if (validation.hasSpecial) {
            specialEl.textContent = '✓ One special character (!@#$%^&*)';
            specialEl.classList.add('valid');
        } else {
            specialEl.textContent = '✗ One special character (!@#$%^&*)';
            specialEl.classList.remove('valid');
        }
    }
}

// ===========================
// Initialize Event Listeners
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const passwordInput = document.getElementById('password');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    // Update password requirements as user types
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            updatePasswordRequirements(e.target.value);
        });
    }
});
