let currentConversationId = null;

// ── Signup ────────────────────────────────────────────────────────────────────
// creates a new account and sends user to the chat page
async function submitSignup() {
    const name = document.getElementById('newUserName').value.trim();
    const email = document.getElementById('newUserEmail').value.trim();
    const password = document.getElementById('newUserPassword1').value;
    const confirm = document.getElementById('newUserPassword2').value;
    const errEl = document.getElementById('errorMessage');

    errEl.innerText = '';

    if (!name) { errEl.innerText = 'Username cannot be empty.'; return; }
    if (!email) { errEl.innerText = 'Email cannot be empty.'; return; }
    if (!password) { errEl.innerText = 'Password cannot be empty.'; return; }
    if (password.length < 8) { errEl.innerText = 'Password must be at least 8 characters.'; return; }
    if (password !== confirm) { errEl.innerText = 'Passwords do not match.'; return; }

    try {
        const res = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, confirmPassword: confirm })
        });

        const data = await res.json();

        if (data.success) {
            window.location.href = '/chat.html';
        } else {
            errEl.innerText = data.message || 'Signup failed. Please try again.';
        }
    } catch (_) {
        errEl.innerText = 'Could not connect to server.';
    }
}

// ── Login ─────────────────────────────────────────────────────────────────────
// logs in an existing user and sends them to the chat page
async function submitLogin() {
    const email = document.getElementById('existingUserEmail').value.trim();
    const password = document.getElementById('existingUserPassword').value;
    const errEl = document.getElementById('errorMessage');

    errEl.innerText = '';

    if (!email) { errEl.innerText = 'Email is required.'; return; }
    if (!password) { errEl.innerText = 'Password is required.'; return; }

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (data.success) {
            window.location.href = '/chat.html';
        } else {
            errEl.innerText = data.message || 'Login failed. Please try again.';
        }
    } catch (_) {
        errEl.innerText = 'Could not connect to server.';
    }
}

// ── Logout ────────────────────────────────────────────────────────────────────
// ends the user session and returns to the login page
async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/logIn.html';
}

// ── Session-aware nav ─────────────────────────────────────────────────────────
// updates navbar based on whether the user is logged in
async function updateNav() {
    try {
        const res = await fetch('/api/me');
        const data = await res.json();

        const loginLink = document.getElementById('nav-login');
        const signupLink = document.getElementById('nav-signup');
        const logoutBtn = document.getElementById('nav-logout');
        const greeting = document.getElementById('nav-greeting');
        const chatLink = document.getElementById('nav-chat');

        if (data.loggedIn) {
            if (loginLink) loginLink.style.display = 'none';
            if (signupLink) signupLink.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'list-item';
            if (chatLink) chatLink.style.display = 'list-item';
            if (greeting) greeting.innerText = `Hi, ${data.user.name}`;
        } else {
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (chatLink) chatLink.style.display = 'none';
            if (greeting) greeting.innerText = '';
        }
    } catch (_) {
        // ignore if server is unavailable
    }
}

// ── Chat helpers ──────────────────────────────────────────────────────────────
// appends one message bubble to the chat window
function appendMessage(role, content) {
    const chatWindow = document.getElementById('chatWindow');
    if (!chatWindow) return;

    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '16px';
    wrapper.style.padding = '10px';
    wrapper.style.borderRadius = '12px';

    if (role === 'user') {
        wrapper.style.backgroundColor = '#d3f9bc';
        wrapper.style.marginLeft = '80px';
        wrapper.innerHTML = `<strong>You:</strong><br>${content}`;
    } else {
        wrapper.style.backgroundColor = '#f4fff1';
        wrapper.style.border = '2px solid #8cc099';
        wrapper.style.marginRight = '80px';
        wrapper.innerHTML = `
            <div style="display:flex;gap:12px;align-items:flex-start;">
                <img src="frog2.png" alt="Frog" style="width:56px;height:auto;">
                <div>
                    <strong>Frog Prompt:</strong><br>${content}
                </div>
            </div>
        `;
    }

    chatWindow.appendChild(wrapper);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// clears all messages from the chat window
function clearChatWindow() {
    const chatWindow = document.getElementById('chatWindow');
    if (chatWindow) {
        chatWindow.innerHTML = '';
    }
}

// shows a status or error message on the chat page
function setChatStatus(message, isError = false) {
    const statusEl = document.getElementById('chatStatus');
    if (!statusEl) return;

    statusEl.innerText = message || '';
    statusEl.style.color = isError ? 'red' : '#2f690a';
}

// ── Iteration 2 features ──────────────────────────────────────────────────────
// sends a message, creates or continues a conversation, and displays the reply
async function sendMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    setChatStatus('');
    input.value = '';

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                conversationId: currentConversationId
            })
        });

        const data = await res.json();

        if (!data.success) {
            setChatStatus(data.message || 'Could not send message.', true);
            return;
        }

        appendMessage('user', data.userMessage.content);
        appendMessage('assistant', data.assistantMessage.content);

        currentConversationId = data.conversationId;

        await loadHistory();
    } catch (_) {
        setChatStatus('Could not connect to server.', true);
    }
}

// loads all past conversations into the history sidebar
async function loadHistory() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;

    try {
        const res = await fetch('/api/conversations');
        const data = await res.json();

        historyList.innerHTML = '';

        if (!data.success) {
            historyList.innerHTML = '<div style="padding:8px;color:red;">Could not load history.</div>';
            return;
        }

        if (data.conversations.length === 0) {
            historyList.innerHTML = '<div style="padding:8px;">No conversations yet.</div>';
            return;
        }

        data.conversations.forEach(conv => {
            const item = document.createElement('button');
            item.type = 'button';
            item.style.display = 'block';
            item.style.width = '100%';
            item.style.textAlign = 'left';
            item.style.marginBottom = '10px';
            item.style.padding = '10px';
            item.style.borderRadius = '10px';
            item.style.border = '1px solid #8cc099';
            item.style.backgroundColor = 'white';
            item.style.cursor = 'pointer';
            item.innerHTML = `
                <strong>${conv.title || 'Untitled Conversation'}</strong><br>
                <span style="font-size:12px;">${conv.preview || ''}</span><br>
                <span style="font-size:11px;color:#666;">${new Date(conv.updatedAt).toLocaleString()}</span>
            `;

            item.addEventListener('click', () => {
                loadConversation(conv._id);
            });

            historyList.appendChild(item);
        });
    } catch (_) {
        historyList.innerHTML = '<div style="padding:8px;color:red;">Could not load history.</div>';
    }
}

// loads one saved conversation into the chat window so user can continue it
async function loadConversation(id) {
    try {
        const res = await fetch(`/api/conversations/${id}`);
        const data = await res.json();

        if (!data.success) {
            setChatStatus(data.message || 'Could not load conversation.', true);
            return;
        }

        currentConversationId = data.conversation._id;
        clearChatWindow();

        (data.conversation.messages || []).forEach(msg => {
            appendMessage(msg.role, msg.content);
        });

        setChatStatus(`Loaded conversation: ${data.conversation.title}`);
    } catch (_) {
        setChatStatus('Could not load conversation.', true);
    }
}

// searches the conversation history list by keyword
async function searchHistory() {
    const searchInput = document.getElementById('historySearch');
    const historyList = document.getElementById('historyList');
    if (!searchInput || !historyList) return;

    const q = searchInput.value.trim();

    try {
        const res = await fetch(`/api/conversations/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();

        historyList.innerHTML = '';

        if (!data.success) {
            historyList.innerHTML = '<div style="padding:8px;color:red;">Search failed.</div>';
            return;
        }

        if (data.conversations.length === 0) {
            historyList.innerHTML = '<div style="padding:8px;">No results found.</div>';
            return;
        }

        data.conversations.forEach(conv => {
            const item = document.createElement('button');
            item.type = 'button';
            item.style.display = 'block';
            item.style.width = '100%';
            item.style.textAlign = 'left';
            item.style.marginBottom = '10px';
            item.style.padding = '10px';
            item.style.borderRadius = '10px';
            item.style.border = '1px solid #8cc099';
            item.style.backgroundColor = 'white';
            item.style.cursor = 'pointer';
            item.innerHTML = `
                <strong>${conv.title || 'Untitled Conversation'}</strong><br>
                <span style="font-size:12px;">${conv.preview || ''}</span><br>
                <span style="font-size:11px;color:#666;">${new Date(conv.updatedAt).toLocaleString()}</span>
            `;

            item.addEventListener('click', () => {
                loadConversation(conv._id);
            });

            historyList.appendChild(item);
        });
    } catch (_) {
        historyList.innerHTML = '<div style="padding:8px;color:red;">Search failed.</div>';
    }
}

// starts a brand-new conversation without deleting saved history
function newConversation() {
    currentConversationId = null;
    clearChatWindow();
    setChatStatus('Started a new conversation.');
}

// allows pressing Enter to send a message or run search
function registerPageEvents() {
    const chatInput = document.getElementById('chatInput');
    const historySearch = document.getElementById('historySearch');

    if (chatInput) {
        chatInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                sendMessage();
            }
        });
    }

    if (historySearch) {
        historySearch.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                searchHistory();
            }
        });

        historySearch.addEventListener('input', () => {
            if (historySearch.value.trim() === '') {
                loadHistory();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await updateNav();
    registerPageEvents();

    if (document.getElementById('historyList')) {
        await loadHistory();
    }
});
