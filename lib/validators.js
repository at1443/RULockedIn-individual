/**
 * Shared input validation helpers.
 * These are pure functions with no I/O — easy to unit-test with Jasmine.
 */

/**
 * Validate sign-up form input.
 * @param {{ name: string, email: string, password: string, confirmPassword: string }} input
 * @returns {{ valid: boolean, message: string }}
 */
function validateSignupInput({ name, email, password, confirmPassword }) {
    if (!name || name.trim() === '') {
        return { valid: false, message: 'Username cannot be empty.' };
    }
    if (!email || email.trim() === '') {
        return { valid: false, message: 'Email cannot be empty.' };
    }
    if (!isValidEmail(email)) {
        return { valid: false, message: 'Please enter a valid email address.' };
    }
    if (!password || password.length === 0) {
        return { valid: false, message: 'Password cannot be empty.' };
    }
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters.' };
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
        return { valid: false, message: 'Passwords do not match.' };
    }
    return { valid: true, message: '' };
}

/**
 * Validate login form input.
 * @param {{ email: string, password: string }} input
 * @returns {{ valid: boolean, message: string }}
 */
function validateLoginInput({ email, password }) {
    if (!email || email.trim() === '') {
        return { valid: false, message: 'Email is required.' };
    }
    if (!password || password.length === 0) {
        return { valid: false, message: 'Password is required.' };
    }
    return { valid: true, message: '' };
}

/**
 * Basic email format check.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = { validateSignupInput, validateLoginInput, isValidEmail };
