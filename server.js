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
    cookie: { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
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

let users;
let conversations;

// ── Helpers ───────────────────────────────────────────────────────────────────
function requireLogin(req, res) {
    if (!req.session.user) {
        res.status(401).json({ success: false, message: 'You must be logged in.' });
        return false;
    }
    return true;
}

// ── Ollama helpers ────────────────────────────────────────────────────────────
const OLLAMA_BASE = process.env.OLLAMA_HOST || 'http://localhost:11434';

// calls the Ollama /api/chat endpoint and returns the reply string
async function callOllama(model, messages) {
    const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: false })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Ollama error (${response.status}): ${text}`);
    }

    const data = await response.json();
    return data.message?.content || '(no response)';
}

// returns list of installed model names from Ollama
async function getOllamaModels() {
    const response = await fetch(`${OLLAMA_BASE}/api/tags`);
    if (!response.ok) throw new Error('Could not reach Ollama');
    const data = await response.json();
    return (data.models || []).map(m => m.name);
}

// ── Auth Routes ───────────────────────────────────────────────────────────────
async function signupHandler(req, res) {
    const { name, email, password, confirmPassword } = req.body;
    const validation = validateSignupInput({ name, email, password, confirmPassword });
    if (!validation.valid) return res.json({ success: false, message: validation.message });

    const existing = await users.findOne({ email: email.toLowerCase() });
    if (existing) return res.json({ success: false, message: 'An account with that email already exists.' });

    const hashed = await bcrypt.hash(password, 10);
    const result = await users.insertOne({
        name: name.trim(), email: email.toLowerCase(), password: hashed, createdAt: new Date()
    });

    req.session.user = { _id: result.insertedId.toString(), name: name.trim(), email: email.toLowerCase() };
    return res.json({ success: true });
}

async function loginHandler(req, res) {
    const { email, password } = req.body;
    const validation = validateLoginInput({ email, password });
    if (!validation.valid) return res.json({ success: false, message: validation.message });

    const user = await users.findOne({ email: email.toLowerCase() });
    if (!user || !user.password) return res.json({ success: false, message: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ success: false, message: 'Invalid email or password.' });

    req.session.user = { _id: user._id.toString(), name: user.name, email: user.email };
    return res.json({ success: true, name: user.name });
}

function logoutHandler(req, res) {
    req.session.destroy(() => res.json({ success: true }));
}

function meHandler(req, res) {
    if (req.session.user) res.json({ loggedIn: true, user: req.session.user });
    else res.json({ loggedIn: false });
}

// ── Ollama Routes ─────────────────────────────────────────────────────────────

// returns all locally installed Ollama models
async function ollamaModelsHandler(req, res) {
    try {
        const models = await getOllamaModels();
        return res.json({ success: true, models });
    } catch (err) {
        return res.json({ success: false, message: 'Could not reach Ollama. Is it running?' });
    }
}

// pulls (downloads) a model into Ollama
async function ollamaPullHandler(req, res) {
    const { model } = req.body;
    if (!model) return res.json({ success: false, message: 'Model name required.' });

    try {
        const response = await fetch(`${OLLAMA_BASE}/api/pull`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, stream: false })
        });
        if (!response.ok) return res.json({ success: false, message: `Pull failed: ${response.statusText}` });
        return res.json({ success: true, message: `Model "${model}" pulled successfully.` });
    } catch (err) {
        return res.json({ success: false, message: 'Could not reach Ollama. Is it running?' });
    }
}

// ── Chat Route (single model) ─────────────────────────────────────────────────
async function chatHandler(req, res) {
    if (!requireLogin(req, res)) return;

    const { message, conversationId, model } = req.body;
    const selectedModel = model || 'llama3.2';

    if (!message || message.trim() === '') return res.json({ success: false, message: 'Message cannot be empty.' });

    const userId = req.session.user._id;
    let conversation;

    if (conversationId) {
        if (!ObjectId.isValid(conversationId)) return res.json({ success: false, message: 'Invalid conversation id.' });
        conversation = await conversations.findOne({ _id: new ObjectId(conversationId), userId });
        if (!conversation) return res.json({ success: false, message: 'Conversation not found.' });
    } else {
        const newConv = {
            userId,
            title: message.trim().slice(0, 50),
            preview: message.trim().slice(0, 80),
            messages: [],
            model: selectedModel,
            isComparison: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const result = await conversations.insertOne(newConv);
        conversation = { ...newConv, _id: result.insertedId };
    }

    const userMessage = { role: 'user', content: message.trim(), createdAt: new Date() };
    conversation.messages.push(userMessage);

    // pass full message history to Ollama for context-aware replies
    const ollamaHistory = conversation.messages.map(m => ({ role: m.role, content: m.content }));

    let replyContent;
    try {
        replyContent = await callOllama(selectedModel, ollamaHistory);
    } catch (err) {
        return res.json({ success: false, message: `Model error: ${err.message}` });
    }

    const assistantMessage = { role: 'assistant', content: replyContent, model: selectedModel, createdAt: new Date() };
    conversation.messages.push(assistantMessage);

    await conversations.updateOne(
        { _id: conversation._id },
        { $set: { messages: conversation.messages, preview: message.trim().slice(0, 80), updatedAt: new Date() } }
    );

    return res.json({ success: true, conversationId: conversation._id.toString(), userMessage, assistantMessage });
}

// ── Compare Chat Route (two models in parallel) ───────────────────────────────
async function compareChatHandler(req, res) {
    if (!requireLogin(req, res)) return;

    const { message, modelA, modelB, conversationId } = req.body;

    if (!message || message.trim() === '') return res.json({ success: false, message: 'Message cannot be empty.' });
    if (!modelA || !modelB) return res.json({ success: false, message: 'Two models are required for comparison.' });

    const userId = req.session.user._id;
    let conversation;

    if (conversationId) {
        if (!ObjectId.isValid(conversationId)) return res.json({ success: false, message: 'Invalid conversation id.' });
        conversation = await conversations.findOne({ _id: new ObjectId(conversationId), userId });
        if (!conversation) return res.json({ success: false, message: 'Conversation not found.' });
    } else {
        const newConv = {
            userId,
            title: message.trim().slice(0, 50),
            preview: message.trim().slice(0, 80),
            messages: [],
            modelA,
            modelB,
            isComparison: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const result = await conversations.insertOne(newConv);
        conversation = { ...newConv, _id: result.insertedId };
    }

    // build context from prior user messages only (shared between both models)
    const priorUserMessages = conversation.messages
        .filter(m => m.role === 'user')
        .map(m => ({ role: 'user', content: m.content }));
    const promptHistory = [...priorUserMessages, { role: 'user', content: message.trim() }];

    // fire both models at the same time
    const [resultA, resultB] = await Promise.allSettled([
        callOllama(modelA, promptHistory),
        callOllama(modelB, promptHistory)
    ]);

    const replyA = resultA.status === 'fulfilled' ? resultA.value : `Error: ${resultA.reason?.message || 'Model failed'}`;
    const replyB = resultB.status === 'fulfilled' ? resultB.value : `Error: ${resultB.reason?.message || 'Model failed'}`;

    const userMessage   = { role: 'user',      content: message.trim(), createdAt: new Date() };
    const assistantA    = { role: 'assistant',  content: replyA, model: modelA, side: 'A', createdAt: new Date() };
    const assistantB    = { role: 'assistant',  content: replyB, model: modelB, side: 'B', createdAt: new Date() };

    conversation.messages.push(userMessage, assistantA, assistantB);

    await conversations.updateOne(
        { _id: conversation._id },
        { $set: { messages: conversation.messages, modelA, modelB, preview: message.trim().slice(0, 80), updatedAt: new Date() } }
    );

    return res.json({ success: true, conversationId: conversation._id.toString(), userMessage, assistantA, assistantB, modelA, modelB });
}

// ── History Routes ────────────────────────────────────────────────────────────

// returns regular OR comparison conversations depending on ?comparison=true
async function getConversationsHandler(req, res) {
    if (!requireLogin(req, res)) return;

    const userId = req.session.user._id;
    const isComparison = req.query.comparison === 'true';

    const docs = await conversations
        .find({ userId, isComparison })
        .sort({ updatedAt: -1 })
        .toArray();

    return res.json({
        success: true,
        conversations: docs.map(doc => ({
            _id: doc._id.toString(),
            title: doc.title || 'Untitled Conversation',
            preview: doc.preview || '',
            model: doc.model,
            modelA: doc.modelA,
            modelB: doc.modelB,
            isComparison: doc.isComparison,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
        }))
    });
}

async function getConversationByIdHandler(req, res) {
    if (!requireLogin(req, res)) return;

    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.json({ success: false, message: 'Invalid conversation id.' });

    const userId = req.session.user._id;
    const doc = await conversations.findOne({ _id: new ObjectId(id), userId });
    if (!doc) return res.json({ success: false, message: 'Conversation not found.' });

    return res.json({
        success: true,
        conversation: {
            _id: doc._id.toString(),
            title: doc.title,
            preview: doc.preview,
            model: doc.model,
            modelA: doc.modelA,
            modelB: doc.modelB,
            isComparison: doc.isComparison,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            messages: doc.messages || []
        }
    });
}

async function searchConversationsHandler(req, res) {
    if (!requireLogin(req, res)) return;

    const q = (req.query.q || '').trim();
    const userId = req.session.user._id;
    const isComparison = req.query.comparison === 'true';

    const filter = q
        ? { userId, isComparison, 'messages.content': { $regex: q, $options: 'i' } }
        : { userId, isComparison };

    const docs = await conversations.find(filter).sort({ updatedAt: -1 }).toArray();

    return res.json({
        success: true,
        conversations: docs.map(doc => ({
            _id: doc._id.toString(),
            title: doc.title || 'Untitled Conversation',
            preview: doc.preview || '',
            modelA: doc.modelA,
            modelB: doc.modelB,
            isComparison: doc.isComparison,
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

        app.get('/api/ollama/models', ollamaModelsHandler);
        app.post('/api/ollama/pull', ollamaPullHandler);

        app.post('/api/chat', chatHandler);
        app.post('/api/chat/compare', compareChatHandler);
        app.get('/api/conversations', getConversationsHandler);
        app.get('/api/conversations/search', searchConversationsHandler);
        app.get('/api/conversations/:id', getConversationByIdHandler);

        app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
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
    compareChatHandler,
    getConversationsHandler,
    getConversationByIdHandler,
    searchConversationsHandler
};
