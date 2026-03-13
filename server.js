require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { MongoClient, ServerApiVersion } = require('mongodb');
const path = require('path');
const { validateSignupInput, validateLoginInput } = require('./lib/validators');

const app = express();
const PORT = process.env.PORT || 8080;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'frogprompt-secret-change-in-prod',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));
app.use(express.static(path.join(__dirname)));

// ── MongoDB setup ─────────────────────────────────────────────────────────────
const client = new MongoClient(process.env.MONGO_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    }
});

let users; // userLoginData collection

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/signup
async function signupHandler(req, res) {
    const { name, email, password, confirmPassword } = req.body;

    const validation = validateSignupInput({ name, email, password, confirmPassword });
    if (!validation.valid) {
        return res.json({ success: false, message: validation.message });
    }

    const existing = await users.findOne({ email: email.toLowerCase() });
    if (existing) {
        return res.json({ success: false, message: 'An account with that email already exists.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await users.insertOne({
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashed,
        createdAt: new Date()
    });

    req.session.user = { name: name.trim(), email: email.toLowerCase() };
    return res.json({ success: true });
}

// POST /api/login
async function loginHandler(req, res) {
    const { email, password } = req.body;

    const validation = validateLoginInput({ email, password });
    if (!validation.valid) {
        return res.json({ success: false, message: validation.message });
    }

    const user = await users.findOne({ email: email.toLowerCase() });
    if (!user || !user.password) {
        return res.json({ success: false, message: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.json({ success: false, message: 'Invalid email or password.' });
    }

    req.session.user = { name: user.name, email: user.email };
    return res.json({ success: true, name: user.name });
}

// POST /api/logout
function logoutHandler(req, res) {
    req.session.destroy(() => {
        res.json({ success: true });
    });
}

// GET /api/me — returns current session info
function meHandler(req, res) {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
}

// ── Start server ──────────────────────────────────────────────────────────────
async function startServer() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('dbs');
        users = db.collection('userLoginData');

        app.post('/api/signup', signupHandler);
        app.post('/api/login', loginHandler);
        app.post('/api/logout', logoutHandler);
        app.get('/api/me', meHandler);

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();

// Export handlers for unit testing (without DB dependency)
module.exports = { app, signupHandler, loginHandler, logoutHandler, meHandler };
