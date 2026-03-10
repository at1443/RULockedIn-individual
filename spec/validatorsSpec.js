/**
 * Jasmine unit tests for lib/validators.js
 *
 * Run with:  npm run test:unit
 *
 * These tests are written BEFORE (or alongside) the implementation, following
 * TDD practice as required by the Development Team rubric.
 */

const { validateSignupInput, validateLoginInput, isValidEmail } = require('../lib/validators');

// ── validateSignupInput ───────────────────────────────────────────────────────
describe('validateSignupInput', () => {

    describe('username validation', () => {
        it('fails when name is empty string', () => {
            const result = validateSignupInput({ name: '', email: 'a@b.com', password: 'password1' });
            expect(result.valid).toBe(false);
            expect(result.message).toBe('Username cannot be empty.');
        });

        it('fails when name is only whitespace', () => {
            const result = validateSignupInput({ name: '   ', email: 'a@b.com', password: 'password1' });
            expect(result.valid).toBe(false);
        });

        it('fails when name is null', () => {
            const result = validateSignupInput({ name: null, email: 'a@b.com', password: 'password1' });
            expect(result.valid).toBe(false);
        });
    });

    describe('email validation', () => {
        it('fails when email is empty', () => {
            const result = validateSignupInput({ name: 'Jeff', email: '', password: 'password1' });
            expect(result.valid).toBe(false);
            expect(result.message).toBe('Email cannot be empty.');
        });

        it('fails when email format is invalid', () => {
            const result = validateSignupInput({ name: 'Jeff', email: 'notanemail', password: 'password1' });
            expect(result.valid).toBe(false);
            expect(result.message).toBe('Please enter a valid email address.');
        });

        it('passes with a valid email format', () => {
            const result = validateSignupInput({ name: 'Jeff', email: 'jeff@rutgers.edu', password: 'password1' });
            expect(result.valid).toBe(true);
        });
    });

    describe('password validation', () => {
        it('fails when password is empty', () => {
            const result = validateSignupInput({ name: 'Jeff', email: 'a@b.com', password: '' });
            expect(result.valid).toBe(false);
            expect(result.message).toBe('Password cannot be empty.');
        });

        it('fails when password is shorter than 8 characters', () => {
            const result = validateSignupInput({ name: 'Jeff', email: 'a@b.com', password: 'short' });
            expect(result.valid).toBe(false);
            expect(result.message).toBe('Password must be at least 8 characters.');
        });

        it('passes when password is exactly 8 characters', () => {
            const result = validateSignupInput({ name: 'Jeff', email: 'a@b.com', password: 'eightchr' });
            expect(result.valid).toBe(true);
        });
    });

    describe('confirm password validation', () => {
        it('fails when passwords do not match', () => {
            const result = validateSignupInput({
                name: 'Jeff', email: 'a@b.com',
                password: 'password1', confirmPassword: 'password2'
            });
            expect(result.valid).toBe(false);
            expect(result.message).toBe('Passwords do not match.');
        });

        it('passes when passwords match', () => {
            const result = validateSignupInput({
                name: 'Jeff', email: 'a@b.com',
                password: 'password1', confirmPassword: 'password1'
            });
            expect(result.valid).toBe(true);
        });

        it('skips confirm check when confirmPassword is not provided', () => {
            const result = validateSignupInput({ name: 'Jeff', email: 'a@b.com', password: 'password1' });
            expect(result.valid).toBe(true);
        });
    });

    it('returns valid:true for fully valid input', () => {
        const result = validateSignupInput({
            name: 'Jeff',
            email: 'jeff@rutgers.edu',
            password: 'securepassword',
            confirmPassword: 'securepassword'
        });
        expect(result.valid).toBe(true);
        expect(result.message).toBe('');
    });
});

// ── validateLoginInput ────────────────────────────────────────────────────────
describe('validateLoginInput', () => {

    it('fails when email is empty', () => {
        const result = validateLoginInput({ email: '', password: 'password' });
        expect(result.valid).toBe(false);
        expect(result.message).toBe('Email is required.');
    });

    it('fails when email is null', () => {
        const result = validateLoginInput({ email: null, password: 'password' });
        expect(result.valid).toBe(false);
    });

    it('fails when password is empty', () => {
        const result = validateLoginInput({ email: 'a@b.com', password: '' });
        expect(result.valid).toBe(false);
        expect(result.message).toBe('Password is required.');
    });

    it('fails when password is null', () => {
        const result = validateLoginInput({ email: 'a@b.com', password: null });
        expect(result.valid).toBe(false);
    });

    it('passes when both email and password are provided', () => {
        const result = validateLoginInput({ email: 'jeff@rutgers.edu', password: 'anypassword' });
        expect(result.valid).toBe(true);
        expect(result.message).toBe('');
    });
});

// ── isValidEmail ──────────────────────────────────────────────────────────────
describe('isValidEmail', () => {

    it('returns true for standard email format', () => {
        expect(isValidEmail('user@example.com')).toBe(true);
    });

    it('returns true for Rutgers scarletmail address', () => {
        expect(isValidEmail('jdm123@scarletmail.rutgers.edu')).toBe(true);
    });

    it('returns false for missing @', () => {
        expect(isValidEmail('userexample.com')).toBe(false);
    });

    it('returns false for missing domain', () => {
        expect(isValidEmail('user@')).toBe(false);
    });

    it('returns false for empty string', () => {
        expect(isValidEmail('')).toBe(false);
    });

    it('returns false for string with spaces', () => {
        expect(isValidEmail('user @example.com')).toBe(false);
    });
});
