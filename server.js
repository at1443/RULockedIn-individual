require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const path = require('path');
const { validateSignupInput, validateLoginInput } = require('./lib/validators');

const app = express();
const PORT = process.env.PORT || 8080;

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

let users;          // stores user accounts
let conversations;  // stores saved chat history

// ── Helpers ───────────────────────────────────────────────────────────────────
function requireLogin(req, res) {
    if (!req.session.user) {
        res.status(401).json({ success: false, message: 'You must be logged in.' });
        return false;
    }
    return true;
}

// temporary LLM function for iteration 2
// this returns a context-aware reply based on previous messages
function generateAssistantReply(history, newMessage) {
    const previousUserMessages = history
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content);

    if (previousUserMessages.length > 0) {
        const lastTopic = previousUserMessages[previousUserMessages.length - 1];
        return `🐸 Frog Prompt remembers your earlier message: "${lastTopic}". Here is my response to "${newMessage}".`;
    }

    return `🐸 Frog Prompt says: I received your message "${newMessage}".`;
}

// ── Auth Routes ───────────────────────────────────────────────────────────────

// creates a new account and starts a session
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

    const result = await users.insertOne({
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashed,
        createdAt: new Date()
    });

    req.session.user = {
        _id: result.insertedId.toString(),
        name: name.trim(),
        email: email.toLowerCase()
    };

    return res.json({ success: true });
}

// logs in an existing user and starts a session
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

    req.session.user = {
        _id: user._id.toString(),
        name: user.name,
        email: user.email
    };

    return res.json({ success: true, name: user.name });
}

// logs out the current user
function logoutHandler(req, res) {
    req.session.destroy(() => {
        res.json({ success: true });
    });
}

// returns session info for navbar and access control
function meHandler(req, res) {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
}

// ── Iteration 2 Chat Routes ───────────────────────────────────────────────────

// sends a message, creates or continues a conversation, and saves both messages
async function chatHandler(req, res) {
    if (!requireLogin(req, res)) return;

    const { message, conversationId } = req.body;

    if (!message || message.trim() === '') {
        return res.json({ success: false, message: 'Message cannot be empty.' });
    }

    const userId = req.session.user._id;
    let conversation;

    if (conversationId) {
        if (!ObjectId.isValid(conversationId)) {
            return res.json({ success: false, message: 'Invalid conversation id.' });
        }

        conversation = await conversations.findOne({
            _id: new ObjectId(conversationId),
            userId
        });

        if (!conversation) {
            return res.json({ success: false, message: 'Conversation not found.' });
        }
    } else {
        const firstMessage = message.trim();

        const newConversation = {
            userId,
            title: firstMessage.slice(0, 50),
            preview: firstMessage.slice(0, 80),
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await conversations.insertOne(newConversation);

        conversation = {
            ...newConversation,
            _id: result.insertedId
        };
    }

    const userMessage = {
        role: 'user',
        content: message.trim(),
        createdAt: new Date()
    };

    conversation.messages.push(userMessage);

    const assistantReply = generateAssistantReply(conversation.messages.slice(0, -1), message.trim());

    const assistantMessage = {
        role: 'assistant',
        content: assistantReply,
        createdAt: new Date()
    };

    conversation.messages.push(assistantMessage);

    await conversations.updateOne(
        { _id: conversation._id },
        {
            $set: {
                messages: conversation.messages,
                preview: message.trim().slice(0, 80),
                updatedAt: new Date()
            }
        }
    );

    return res.json({
        success: true,
        conversationId: conversation._id.toString(),
        userMessage,
        assistantMessage
    });
}

// returns all saved conversations for the logged-in user
async function getConversationsHandler(req, res) {
    if (!requireLogin(req, res)) return;

    const userId = req.session.user._id;

    const docs = await conversations
        .find({ userId })
        .sort({ updatedAt: -1 })
        .toArray();

    const results = docs.map(doc => ({
        _id: doc._id.toString(),
        title: doc.title || 'Untitled Conversation',
        preview: doc.preview || '',
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
    }));

    return res.json({ success: true, conversations: results });
}

// returns one full conversation when clicked in history
async function getConversationByIdHandler(req, res) {
    if (!requireLogin(req, res)) return;

    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
        return res.json({ success: false, message: 'Invalid conversation id.' });
    }

    const userId = req.session.user._id;

    const doc = await conversations.findOne({
        _id: new ObjectId(id),
        userId
    });

    if (!doc) {
        return res.json({ success: false, message: 'Conversation not found.' });
    }

    return res.json({
        success: true,
        conversation: {
            _id: doc._id.toString(),
            title: doc.title,
            preview: doc.preview,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            messages: doc.messages || []
        }
    });
}

// searches the user's saved conversations by keyword
async function searchConversationsHandler(req, res) {
    if (!requireLogin(req, res)) return;

    const q = (req.query.q || '').trim();
    const userId = req.session.user._id;

    if (!q) {
        const docs = await conversations
            .find({ userId })
            .sort({ updatedAt: -1 })
            .toArray();

        return res.json({
            success: true,
            conversations: docs.map(doc => ({
                _id: doc._id.toString(),
                title: doc.title || 'Untitled Conversation',
                preview: doc.preview || '',
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt
            }))
        });
    }

    const docs = await conversations.find({
        userId,
        'messages.content': { $regex: q, $options: 'i' }
    }).sort({ updatedAt: -1 }).toArray();

    return res.json({
        success: true,
        conversations: docs.map(doc => ({
            _id: doc._id.toString(),
            title: doc.title || 'Untitled Conversation',
            preview: doc.preview || '',
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
        }))
    });
}

// ── Start server ──────────────────────────────────────────────────────────────
async function startServer() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('dbs');
        users = db.collection('userLoginData');
        conversations = db.collection('conversations');

        app.post('/api/signup', signupHandler);
        app.post('/api/login', loginHandler);
        app.post('/api/logout', logoutHandler);
        app.get('/api/me', meHandler);

        app.post('/api/chat', chatHandler);
        app.get('/api/conversations', getConversationsHandler);
        app.get('/api/conversations/search', searchConversationsHandler);
        app.get('/api/conversations/:id', getConversationByIdHandler);

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();

module.exports = {
    app,
    signupHandler,
    loginHandler,
    logoutHandler,
    meHandler,
    chatHandler,
    getConversationsHandler,
    getConversationByIdHandler,
    searchConversationsHandler
};
