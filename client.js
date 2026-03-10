// ── Signup ────────────────────────────────────────────────────────────────────
async function submitSignup() {
    const name     = document.getElementById('newUserName').value.trim();
    const email    = document.getElementById('newUserEmail').value.trim();
    const password = document.getElementById('newUserPassword1').value;
    const confirm  = document.getElementById('newUserPassword2').value;
    const errEl    = document.getElementById('errorMessage');

    errEl.innerText = '';

    if (!name) { errEl.innerText = 'Username cannot be empty.'; return; }
    if (!email) { errEl.innerText = 'Email cannot be empty.'; return; }
    if (!password) { errEl.innerText = 'Password cannot be empty.'; return; }
    if (password.length < 8) { errEl.innerText = 'Password must be at least 8 characters.'; return; }
    if (password !== confirm) { errEl.innerText = 'Passwords do not match.'; return; }

    try {
        const res  = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, confirmPassword: confirm })
        });
        const data = await res.json();

        if (data.success) {
            window.location.href = '/';
        } else {
            errEl.innerText = data.message || 'Signup failed. Please try again.';
        }
    } catch (err) {
        errEl.innerText = 'Could not connect to server.';
    }
}

// ── Login ─────────────────────────────────────────────────────────────────────
async function submitLogin() {
    const email    = document.getElementById('existingUserEmail').value.trim();
    const password = document.getElementById('existingUserPassword').value;
    const errEl    = document.getElementById('errorMessage');

    errEl.innerText = '';

    if (!email)    { errEl.innerText = 'Email is required.';    return; }
    if (!password) { errEl.innerText = 'Password is required.'; return; }

    try {
        const res  = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.success) {
            window.location.href = '/';
        } else {
            errEl.innerText = data.message || 'Login failed. Please try again.';
        }
    } catch (err) {
        errEl.innerText = 'Could not connect to server.';
    }
}

// ── Logout ────────────────────────────────────────────────────────────────────
async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/logIn.html';
}

// ── Session-aware nav ─────────────────────────────────────────────────────────
async function updateNav() {
    try {
        const res  = await fetch('/api/me');
        const data = await res.json();

        const loginLink  = document.getElementById('nav-login');
        const signupLink = document.getElementById('nav-signup');
        const logoutBtn  = document.getElementById('nav-logout');
        const greeting   = document.getElementById('nav-greeting');

        if (data.loggedIn) {
            if (loginLink)  loginLink.style.display  = 'none';
            if (signupLink) signupLink.style.display = 'none';
            if (logoutBtn)  logoutBtn.style.display  = 'list-item';
            if (greeting)   greeting.innerText        = `Hi, ${data.user.name}`;
        } else {
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    } catch (_) { /* server not running, ignore */ }
}

document.addEventListener('DOMContentLoaded', updateNav);
