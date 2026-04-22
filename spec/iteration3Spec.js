/**
 * Jasmine unit tests for Iteration 3 features
 * Tests written before/alongside implementation following TDD practice.
 *
 * Run with: npx jasmine
 */

const {
    chatHandler,
    compareChatHandler,
    getConversationsHandler,
    ollamaModelsHandler
} = require('../server');

// ── Helper to mock req/res ────────────────────────────────────────────────────
function mockRes() {
    const res = { _data: null };
    res.status = jasmine.createSpy('status').and.returnValue(res);
    res.json = jasmine.createSpy('json').and.callFake((data) => { res._data = data; });
    return res;
}

// ── chatHandler ───────────────────────────────────────────────────────────────
describe('chatHandler', () => {

    it('rejects an empty message', async () => {
        const req = {
            session: { user: { _id: '123' } },
            body: { message: '   ', model: 'phi3' }
        };
        const res = mockRes();
        await chatHandler(req, res);
        expect(res.json).toHaveBeenCalledWith(jasmine.objectContaining({
            success: false,
            message: 'Message cannot be empty.'
        }));
    });

    it('rejects unauthenticated user', async () => {
        const req = {
            session: {},
            body: { message: 'hello', model: 'phi3' }
        };
        const res = mockRes();
        await chatHandler(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(jasmine.objectContaining({
            success: false
        }));
    });

    it('rejects an invalid conversationId', async () => {
        const req = {
            session: { user: { _id: '123' } },
            body: { message: 'hello', model: 'phi3', conversationId: 'not-valid-id' }
        };
        const res = mockRes();
        await chatHandler(req, res);
        expect(res.json).toHaveBeenCalledWith(jasmine.objectContaining({
            success: false,
            message: 'Invalid conversation id.'
        }));
    });

});

// ── compareChatHandler ────────────────────────────────────────────────────────
describe('compareChatHandler', () => {

    it('rejects an empty message', async () => {
        const req = {
            session: { user: { _id: '123' } },
            body: { message: '', modelA: 'phi3', modelB: 'gemma3:1b' }
        };
        const res = mockRes();
        await compareChatHandler(req, res);
        expect(res.json).toHaveBeenCalledWith(jasmine.objectContaining({
            success: false,
            message: 'Message cannot be empty.'
        }));
    });

    it('rejects when modelA is missing', async () => {
        const req = {
            session: { user: { _id: '123' } },
            body: { message: 'hello', modelA: '', modelB: 'gemma3:1b' }
        };
        const res = mockRes();
        await compareChatHandler(req, res);
        expect(res.json).toHaveBeenCalledWith(jasmine.objectContaining({
            success: false,
            message: 'Two models are required for comparison.'
        }));
    });

    it('rejects when modelB is missing', async () => {
        const req = {
            session: { user: { _id: '123' } },
            body: { message: 'hello', modelA: 'phi3', modelB: '' }
        };
        const res = mockRes();
        await compareChatHandler(req, res);
        expect(res.json).toHaveBeenCalledWith(jasmine.objectContaining({
            success: false,
            message: 'Two models are required for comparison.'
        }));
    });

    it('rejects unauthenticated user', async () => {
        const req = {
            session: {},
            body: { message: 'hello', modelA: 'phi3', modelB: 'gemma3:1b' }
        };
        const res = mockRes();
        await compareChatHandler(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(jasmine.objectContaining({
            success: false
        }));
    });

    it('rejects an invalid conversationId', async () => {
        const req = {
            session: { user: { _id: '123' } },
            body: { message: 'hello', modelA: 'phi3', modelB: 'gemma3:1b', conversationId: 'bad-id' }
        };
        const res = mockRes();
        await compareChatHandler(req, res);
        expect(res.json).toHaveBeenCalledWith(jasmine.objectContaining({
            success: false,
            message: 'Invalid conversation id.'
        }));
    });

});

// ── getConversationsHandler ───────────────────────────────────────────────────
describe('getConversationsHandler', () => {

    it('rejects unauthenticated user', async () => {
        const req = { session: {}, query: {} };
        const res = mockRes();
        await getConversationsHandler(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(jasmine.objectContaining({
            success: false
        }));
    });

});
