let currentConversationId = null;
let compareMode = false;
let currentModelA = null;
let currentModelB = null;

// ── Signup ────────────────────────────────────────────────────────────────────
async function submitSignup() {
    const name     = document.getElementById('newUserName').value.trim();
    const email    = document.getElementById('newUserEmail').value.trim();
    const password = document.getElementById('newUserPassword1').value;
    const confirm  = document.getElementById('newUserPassword2').value;
    const errEl    = document.getElementById('errorMessage');
    errEl.innerText = '';

    if (!name)                  { errEl.innerText = 'Username cannot be empty.'; return; }
    if (!email)                 { errEl.innerText = 'Email cannot be empty.'; return; }
    if (!password)              { errEl.innerText = 'Password cannot be empty.'; return; }
    if (password.length < 8)    { errEl.innerText = 'Password must be at least 8 characters.'; return; }
    if (password !== confirm)   { errEl.innerText = 'Passwords do not match.'; return; }

    try {
        const res  = await fetch('/api/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, confirmPassword: confirm }) });
        const data = await res.json();
        if (data.success) window.location.href = '/chat.html';
        else errEl.innerText = data.message || 'Signup failed.';
    } catch (_) { errEl.innerText = 'Could not connect to server.'; }
}

// ── Login ─────────────────────────────────────────────────────────────────────
async function submitLogin() {
    const email    = document.getElementById('existingUserEmail').value.trim();
    const password = document.getElementById('existingUserPassword').value;
    const errEl    = document.getElementById('errorMessage');
    errEl.innerText = '';

    if (!email)    { errEl.innerText = 'Email is required.'; return; }
    if (!password) { errEl.innerText = 'Password is required.'; return; }

    try {
        const res  = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
        const data = await res.json();
        if (data.success) window.location.href = '/chat.html';
        else errEl.innerText = data.message || 'Login failed.';
    } catch (_) { errEl.innerText = 'Could not connect to server.'; }
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
        const chatLink   = document.getElementById('nav-chat');

        if (data.loggedIn) {
            if (loginLink)  loginLink.style.display  = 'none';
            if (signupLink) signupLink.style.display  = 'none';
            if (logoutBtn)  logoutBtn.style.display   = 'list-item';
            if (chatLink)   chatLink.style.display    = 'list-item';
            if (greeting)   greeting.innerText        = `Hi, ${data.user.name}`;
        } else {
            if (logoutBtn)  logoutBtn.style.display   = 'none';
            if (chatLink)   chatLink.style.display    = 'none';
            if (greeting)   greeting.innerText        = '';
        }
    } catch (_) {}
}

// ── Model dropdown ────────────────────────────────────────────────────────────

// fetches installed Ollama models and populates any <select> with the given id
async function populateModelSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Loading models…</option>';

    try {
        const res  = await fetch('/api/ollama/models');
        const data = await res.json();

        select.innerHTML = '';

        if (!data.success || data.models.length === 0) {
            select.innerHTML = '<option value="">No models found</option>';
            return;
        }

        data.models.forEach(m => {
            const opt   = document.createElement('option');
            opt.value   = m;
            opt.textContent = m;
            select.appendChild(opt);
        });
    } catch (_) {
        select.innerHTML = '<option value="">Could not load models</option>';
    }
}

// ── Chat helpers ──────────────────────────────────────────────────────────────
function appendMessage(role, content, modelLabel) {
    const chatWindow = document.getElementById('chatWindow');
    if (!chatWindow) return;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'margin-bottom:16px;padding:10px;border-radius:12px;';

    if (role === 'user') {
        wrapper.style.backgroundColor = '#d3f9bc';
        wrapper.style.marginLeft = '80px';
        wrapper.innerHTML = `<strong>You:</strong><br>${content}`;
    } else {
        wrapper.style.backgroundColor = '#f4fff1';
        wrapper.style.border = '2px solid #8cc099';
        wrapper.style.marginRight = '80px';
        const label = modelLabel ? `<span style="font-size:11px;color:#555;">${modelLabel}</span><br>` : '';
        wrapper.innerHTML = `
            <div style="display:flex;gap:12px;align-items:flex-start;">
                <img src="frog2.png" alt="Frog" style="width:56px;height:auto;">
                <div>${label}<strong>Frog Prompt:</strong><br>${content}</div>
            </div>`;
    }

    chatWindow.appendChild(wrapper);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// renders two responses side by side for compare mode
function appendCompareMessages(prompt, replyA, modelA, replyB, modelB) {
    const chatWindow = document.getElementById('chatWindow');
    if (!chatWindow) return;

    // user prompt
    const userDiv = document.createElement('div');
    userDiv.style.cssText = 'margin-bottom:16px;padding:10px;border-radius:12px;background:#d3f9bc;margin-left:80px;';
    userDiv.innerHTML = `<strong>You:</strong><br>${prompt}`;
    chatWindow.appendChild(userDiv);

    // side-by-side wrapper
    const row = document.createElement('div');
    row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;';

    [{ reply: replyA, model: modelA }, { reply: replyB, model: modelB }].forEach(({ reply, model }) => {
        const panel = document.createElement('div');
        panel.style.cssText = 'padding:10px;border-radius:12px;background:#f4fff1;border:2px solid #8cc099;';
        const isError = reply.startsWith('Error:');
        panel.innerHTML = `
            <div style="font-weight:bold;margin-bottom:6px;background:#8cc099;padding:4px 8px;border-radius:6px;display:inline-block;">${model}</div>
            <br><br>
            <div style="color:${isError ? 'red' : 'inherit'};">${reply}</div>`;
        row.appendChild(panel);
    });

    chatWindow.appendChild(row);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function clearChatWindow() {
    const cw = document.getElementById('chatWindow');
    if (cw) cw.innerHTML = '';
}

function setChatStatus(message, isError = false) {
    const el = document.getElementById('chatError');
    if (!el) return;
    el.innerText = message || '';
    el.style.color = isError ? 'red' : '#2f690a';
}

// ── Send message (single model) ───────────────────────────────────────────────
async function sendMessage() {
    if (compareMode) { await sendCompareMessage(); return; }

    const input = document.getElementById('chatInput');
    const modelSelect = document.getElementById('modelSelect');
    if (!input) return;

    const message = input.value.trim();
    const model   = modelSelect ? modelSelect.value : '';

    if (!message) return;
    if (!model)   { setChatStatus('Please select a model first.', true); return; }

    setChatStatus('');
    input.value = '';

    try {
        const res  = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, model, conversationId: currentConversationId })
        });
        const data = await res.json();

        if (!data.success) { setChatStatus(data.message || 'Could not send message.', true); return; }

        appendMessage('user', data.userMessage.content);
        appendMessage('assistant', data.assistantMessage.content, data.assistantMessage.model);

        currentConversationId = data.conversationId;
        await loadConversations();
    } catch (_) { setChatStatus('Could not connect to server.', true); }
}

// ── Send message (compare mode) ───────────────────────────────────────────────
async function sendCompareMessage() {
    const input  = document.getElementById('chatInput');
    if (!input) return;

    const message = input.value.trim();
    const modelA  = currentModelA;
    const modelB  = currentModelB;

    if (!message) return;
    if (!modelA || !modelB) { setChatStatus('Select two models to compare.', true); return; }

    setChatStatus('');
    input.value = '';

    try {
        const res  = await fetch('/api/chat/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, modelA, modelB, conversationId: currentConversationId })
        });
        const data = await res.json();

        if (!data.success) { setChatStatus(data.message || 'Could not send message.', true); return; }

        appendCompareMessages(message, data.assistantA.content, data.modelA, data.assistantB.content, data.modelB);

        currentConversationId = data.conversationId;
        await loadConversations(true);
    } catch (_) { setChatStatus('Could not connect to server.', true); }
}

// ── Compare mode toggle ───────────────────────────────────────────────────────
function openCompareModal() {
    const modal = document.getElementById('compareModal');
    if (modal) modal.style.display = 'flex';
}

function closeCompareModal() {
    const modal = document.getElementById('compareModal');
    if (modal) modal.style.display = 'none';
}

async function startCompare() {
    const selA = document.getElementById('compareModelA');
    const selB = document.getElementById('compareModelB');
    if (!selA || !selB) return;

    const modelA = selA.value;
    const modelB = selB.value;

    if (!modelA || !modelB) { alert('Please select both models.'); return; }
    if (modelA === modelB)  { alert('Please select two different models.'); return; }

    currentModelA = modelA;
    currentModelB = modelB;
    compareMode   = true;
    currentConversationId = null;

    clearChatWindow();
    closeCompareModal();

    const banner = document.getElementById('compareBanner');
    if (banner) {
        banner.style.display = 'block';
        banner.innerText = `Compare mode: ${modelA}  vs  ${modelB}`;
    }

    const compareBtn = document.getElementById('compareBtn');
    if (compareBtn) compareBtn.textContent = 'Exit Compare';

    setChatStatus('');
}

function exitCompareMode() {
    compareMode   = false;
    currentModelA = null;
    currentModelB = null;
    currentConversationId = null;

    clearChatWindow();

    const banner = document.getElementById('compareBanner');
    if (banner) banner.style.display = 'none';

    const compareBtn = document.getElementById('compareBtn');
    if (compareBtn) compareBtn.textContent = 'Compare Models';
}

function toggleCompare() {
    if (compareMode) { exitCompareMode(); return; }
    openCompareModal();
}

// ── History ───────────────────────────────────────────────────────────────────

// loads regular OR comparison history depending on the current tab
async function loadConversations(comparison = false) {
    const historyList = document.getElementById('conversationList');
    if (!historyList) return;

    try {
        const res  = await fetch(`/api/conversations?comparison=${comparison}`);
        const data = await res.json();

        historyList.innerHTML = '';

        if (!data.success || data.conversations.length === 0) {
            historyList.innerHTML = '<div style="padding:8px;">No conversations yet.</div>';
            return;
        }

        data.conversations.forEach(conv => {
            const item = document.createElement('button');
            item.type = 'button';
            item.style.cssText = 'display:block;width:100%;text-align:left;margin-bottom:10px;padding:10px;border-radius:10px;border:1px solid #8cc099;background:white;cursor:pointer;';

            const modelInfo = conv.isComparison
                ? `<span style="font-size:11px;color:#555;">${conv.modelA} vs ${conv.modelB}</span><br>`
                : (conv.model ? `<span style="font-size:11px;color:#555;">${conv.model}</span><br>` : '');

            item.innerHTML = `
                <strong>${conv.title || 'Untitled'}</strong><br>
                ${modelInfo}
                <span style="font-size:12px;">${conv.preview || ''}</span><br>
                <span style="font-size:11px;color:#666;">${new Date(conv.updatedAt).toLocaleString()}</span>`;

            item.addEventListener('click', () => loadConversation(conv._id, conv.isComparison));
            historyList.appendChild(item);
        });
    } catch (_) {
        historyList.innerHTML = '<div style="padding:8px;color:red;">Could not load history.</div>';
    }
}

// loads one conversation back into the chat window
async function loadConversation(id, isComparison) {
    try {
        const res  = await fetch(`/api/conversations/${id}`);
        const data = await res.json();
        if (!data.success) { setChatStatus(data.message || 'Could not load conversation.', true); return; }

        const conv = data.conversation;
        currentConversationId = conv._id;
        clearChatWindow();

        if (conv.isComparison) {
            // restore compare mode state
            compareMode   = true;
            currentModelA = conv.modelA;
            currentModelB = conv.modelB;

            const banner = document.getElementById('compareBanner');
            if (banner) {
                banner.style.display = 'block';
                banner.innerText = `Compare mode: ${conv.modelA}  vs  ${conv.modelB}`;
            }
            const compareBtn = document.getElementById('compareBtn');
            if (compareBtn) compareBtn.textContent = 'Exit Compare';

            // replay comparison turns: group messages as [user, assistantA, assistantB]
            const msgs = conv.messages || [];
            for (let i = 0; i < msgs.length; i += 3) {
                const userMsg = msgs[i];
                const msgA    = msgs[i + 1];
                const msgB    = msgs[i + 2];
                if (userMsg && msgA && msgB) {
                    appendCompareMessages(userMsg.content, msgA.content, msgA.model, msgB.content, msgB.model);
                }
            }
        } else {
            compareMode = false;
            const banner = document.getElementById('compareBanner');
            if (banner) banner.style.display = 'none';
            const compareBtn = document.getElementById('compareBtn');
            if (compareBtn) compareBtn.textContent = 'Compare Models';

            (conv.messages || []).forEach(msg => appendMessage(msg.role, msg.content, msg.model));
        }

        setChatStatus(`Loaded: ${conv.title}`);
    } catch (_) { setChatStatus('Could not load conversation.', true); }
}

// ── History tab switching ─────────────────────────────────────────────────────
function showHistoryTab(tab) {
    const isComparison = tab === 'comparison';

    document.getElementById('tabRegular').style.fontWeight    = isComparison ? 'normal' : 'bold';
    document.getElementById('tabComparison').style.fontWeight = isComparison ? 'bold'   : 'normal';

    loadConversations(isComparison);
}

// ── Search ────────────────────────────────────────────────────────────────────
async function searchConversations() {
    const searchInput = document.getElementById('historySearch');
    const historyList = document.getElementById('conversationList');
    if (!searchInput || !historyList) return;

    const q = searchInput.value.trim();
    const isComparison = document.getElementById('tabComparison')?.style.fontWeight === 'bold';

    try {
        const res  = await fetch(`/api/conversations/search?q=${encodeURIComponent(q)}&comparison=${isComparison}`);
        const data = await res.json();

        historyList.innerHTML = '';
        if (!data.success || data.conversations.length === 0) {
            historyList.innerHTML = '<div style="padding:8px;">No results found.</div>';
            return;
        }

        data.conversations.forEach(conv => {
            const item = document.createElement('button');
            item.type = 'button';
            item.style.cssText = 'display:block;width:100%;text-align:left;margin-bottom:10px;padding:10px;border-radius:10px;border:1px solid #8cc099;background:white;cursor:pointer;';
            const modelInfo = conv.isComparison
                ? `<span style="font-size:11px;color:#555;">${conv.modelA} vs ${conv.modelB}</span><br>`
                : '';
            item.innerHTML = `<strong>${conv.title || 'Untitled'}</strong><br>${modelInfo}<span style="font-size:12px;">${conv.preview || ''}</span>`;
            item.addEventListener('click', () => loadConversation(conv._id, conv.isComparison));
            historyList.appendChild(item);
        });
    } catch (_) {
        historyList.innerHTML = '<div style="padding:8px;color:red;">Search failed.</div>';
    }
}

// ── New conversation ──────────────────────────────────────────────────────────
function startNewConversation() {
    currentConversationId = null;
    clearChatWindow();
    if (compareMode) exitCompareMode();
    setChatStatus('Started a new conversation.');
}

// ── Page init ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await updateNav();

    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }
        });

        chatInput.addEventListener('input', updateCharCounter);
    }

    function updateCharCounter() {
        const input = document.getElementById('chatInput');
        const counter = document.getElementById('charCounter');
        if (!input || !counter) return;

        const current = input.value.length;
        const max = 1000;

        counter.textContent = `${current} / ${max} characters`;
        counter.style.color = current >= max ? 'red' : '#555';
    }

    const historySearch = document.getElementById('historySearch');
    if (historySearch) {
        historySearch.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); searchConversations(); }
        });
        historySearch.addEventListener('input', () => {
            if (historySearch.value.trim() === '') loadConversations();
        });
    }

    // populate all model selects on the page
    await populateModelSelect('modelSelect');
    await populateModelSelect('compareModelA');
    await populateModelSelect('compareModelB');

    if (document.getElementById('conversationList')) {
        await loadConversations();
    }
});
