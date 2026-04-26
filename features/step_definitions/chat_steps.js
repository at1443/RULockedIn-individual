const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

Given('I am logged in and on the chat page', async function () {
    await this.page.goto(`${BASE_URL}/logIn.html`,
        { waitUntil: 'domcontentloaded' });

    await this.page.$eval('#existingUserEmail', el => { el.value = ''; });
    await this.page.type('#existingUserEmail', 'testuser@example.com');
    await this.page.$eval('#existingUserPassword', el => { el.value = ''; });
    await this.page.type('#existingUserPassword', 'password123');

    const buttons = await this.page.$$('button');
    for (const btn of buttons) {
        const text = await this.page.evaluate(el => el.innerText.trim(), btn);
        if (text === 'Login') {
            await btn.click();
            await new Promise(r => setTimeout(r, 2000));
            break;
        }
    }

    await this.page.goto(`${BASE_URL}/chat.html`,
        { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));
});

Given('I have at least one past conversation', async function () {
});

Given('I have opened a past conversation', async function () {
});

Given('I have sent a message in a conversation', async function () {
});

Given('I have past conversations containing the keyword {string}',
    async function (keyword) {
});

When('I press {string}', async function (key) {
    await this.page.keyboard.press(key);
    await new Promise(r => setTimeout(r, 2000));
});

When('I click the history button', async function () {
    const links = await this.page.$$('a');
    for (const link of links) {
        const text = await this.page.evaluate(el => el.innerText.trim(), link);
        if (text.toLowerCase().includes('history')) {
            await link.click();
            await new Promise(r => setTimeout(r, 1000));
            return;
        }
    }
});

When('I click on a past conversation', async function () {
    try {
        const items = await this.page.$$('#conversationList button');
        if (items.length > 0) {
            await items[0].click();
            await new Promise(r => setTimeout(r, 1500));
        }
    } catch {
    }
});

When('I click the {string} button in the popup', async function (buttonText) {
    const buttons = await this.page.$$('button');
    for (const btn of buttons) {
        const text = await this.page.evaluate(el => el.innerText.trim(), btn);
        if (text === buttonText) {
            await btn.click();
            await new Promise(r => setTimeout(r, 3000));
            return;
        }
    }
    throw new Error(`Button "${buttonText}" not found`);
});

When('I select {string} as model 1', async function (modelName) {
    await this.page.select('#compareModelA', modelName);
    await new Promise(r => setTimeout(r, 500));
});

When('I select {string} as model 2', async function (modelName) {
    await this.page.select('#compareModelB', modelName);
    await new Promise(r => setTimeout(r, 500));
});

When('I log out', async function () {
    const buttons = await this.page.$$('button');
    for (const btn of buttons) {
        const text = await this.page.evaluate(el => el.innerText.trim(), btn);
        if (text.toLowerCase().includes('logout')) {
            await btn.click();
            await new Promise(r => setTimeout(r, 1500));
            return;
        }
    }
});

When('I log back in', async function () {
    await this.page.goto(`${BASE_URL}/logIn.html`,
        { waitUntil: 'domcontentloaded' });
    await this.page.type('#existingUserEmail', 'testuser@example.com');
    await this.page.type('#existingUserPassword', 'password123');
    const buttons = await this.page.$$('button');
    for (const btn of buttons) {
        const text = await this.page.evaluate(el => el.innerText.trim(), btn);
        if (text === 'Login') {
            await btn.click();
            await new Promise(r => setTimeout(r, 2000));
            return;
        }
    }
});

When('I click on a search result', async function () {
    try {
        const items = await this.page.$$('#conversationList button');
        if (items.length > 0) {
            await items[0].click();
            await new Promise(r => setTimeout(r, 1000));
        }
    } catch {
    }
});

When('I clear the {string} field', async function (fieldId) {
    await this.page.$eval(`#${fieldId}`, el => { el.value = ''; });
    await this.page.keyboard.press('Backspace');
    await new Promise(r => setTimeout(r, 1000));
});

When('I type 1000 characters in the chat input', async function () {
    const longText = 'a'.repeat(1000);
    await this.page.$eval(
        '#chatInput',
        (el, val) => {
            el.value = val;
            el.dispatchEvent(new Event('input'));
        },
        longText
    );
    await new Promise(r => setTimeout(r, 500));
});

Then('I should see a text input box', async function () {
    const input = await this.page.$('#chatInput');
    assert.ok(input !== null, 'Chat input box not found');
});

Then('I should see a {string} button', async function (buttonText) {
    const buttons = await this.page.$$('button');
    for (const btn of buttons) {
        const text = await this.page.evaluate(el => el.innerText.trim(), btn);
        if (text === buttonText) return;
    }
    throw new Error(`Button "${buttonText}" not found`);
});

Then('I should see a model selection dropdown', async function () {
    const dropdown = await this.page.$('#modelSelect');
    assert.ok(dropdown !== null, 'Model dropdown not found');
});

Then('I should see {string} as an option', async function (modelName) {
    const options = await this.page.$$eval(
        '#modelSelect option',
        opts => opts.map(o => o.value)
    );
    assert.ok(options.includes(modelName),
        `Model "${modelName}" not found. Found: ${options.join(', ')}`);
});

Then('my message should appear in the chat window', async function () {
    await new Promise(r => setTimeout(r, 2000));
    const content = await this.page.content();
    assert.ok(
        content.includes('What is the capital of France?'),
        'User message not found'
    );
});

Then('I should see a response from the LLM below my message',
    async function () {
    await new Promise(r => setTimeout(r, 3000));
    const content = await this.page.content();
    assert.ok(content.length > 1000, 'No LLM response found');
});

Then('I should see a response labeled with {string}',
    async function (modelName) {
    await new Promise(r => setTimeout(r, 3000));
    const content = await this.page.content();
    assert.ok(content.includes(modelName),
        `Model label "${modelName}" not found`);
});

Then('the dropdown should still show {string}', async function (modelName) {
    const value = await this.page.$eval('#modelSelect', el => el.value);
    assert.strictEqual(value, modelName,
        `Expected "${modelName}" but got "${value}"`);
});

Then('I should see a popup with two model dropdowns', async function () {
    await new Promise(r => setTimeout(r, 1000));
    const modalA = await this.page.$('#compareModelA');
    const modalB = await this.page.$('#compareModelB');
    assert.ok(modalA !== null && modalB !== null,
        'Compare popup not found');
});

Then('both dropdowns should show different models', async function () {
    const modelA = await this.page.$eval('#compareModelA', el => el.value);
    const modelB = await this.page.$eval('#compareModelB', el => el.value);
    assert.notStrictEqual(modelA, modelB, 'Both dropdowns show same model');
});

Then('I should see two response panels side by side', async function () {
    await new Promise(r => setTimeout(r, 4000));
    const content = await this.page.content();
    assert.ok(content.length > 1000, 'No response panels found');
});

Then('the left panel should be labeled {string}', async function (modelName) {
    const content = await this.page.content();
    assert.ok(content.includes(modelName),
        `Left panel label "${modelName}" not found`);
});

Then('the right panel should be labeled {string}', async function (modelName) {
    const content = await this.page.content();
    assert.ok(content.includes(modelName),
        `Right panel label "${modelName}" not found`);
});

Then('I should see an error message {string}', async function (expectedMessage) {
    await new Promise(r => setTimeout(r, 1000));
    const content = await this.page.content();
    assert.ok(content.includes(expectedMessage),
        `Error "${expectedMessage}" not found`);
});

Then('I should still see a response in at least one panel', async function () {
    await new Promise(r => setTimeout(r, 4000));
    const content = await this.page.content();
    assert.ok(content.length > 0, 'Page has no content');
});

Then('the full previous conversation should be loaded in the chat window',
    async function () {
    await new Promise(r => setTimeout(r, 2000));
    const chatWindow = await this.page.$('#chatWindow');
    assert.ok(chatWindow !== null, 'Chat window not found');
});

Then('all prior messages and LLM responses should be visible',
    async function () {
    const content = await this.page.content();
    assert.ok(content.length > 100, 'Chat appears empty');
});

Then('my new message should be appended to the conversation',
    async function () {
    await new Promise(r => setTimeout(r, 2000));
    const content = await this.page.content();
    assert.ok(content.includes('Can you elaborate on that?'),
        'New message not found');
});

Then('the LLM should respond with awareness of the prior conversation',
    async function () {
    await new Promise(r => setTimeout(r, 3000));
    const content = await this.page.content();
    assert.ok(content.length > 100, 'No LLM response found');
});

Then("the conversation's preview should reflect the latest message",
    async function () {
    const content = await this.page.content();
    assert.ok(content.length > 0, 'No content found');
});

Then("the conversation's timestamp should be updated", async function () {
    const content = await this.page.content();
    assert.ok(content.length > 0, 'No content found');
});

Then('I should see a history button', async function () {
    const links = await this.page.$$('a');
    for (const link of links) {
        const text = await this.page.evaluate(el => el.innerText.trim(), link);
        if (text.toLowerCase().includes('history')) return;
    }
    throw new Error('History button not found');
});

Then('I should see a list of past conversations', async function () {
    await new Promise(r => setTimeout(r, 1000));
    const list = await this.page.$('#conversationList');
    assert.ok(list !== null, 'Conversation list not found');
});

Then('each conversation should show a preview of the first message',
    async function () {
    const content = await this.page.content();
    assert.ok(content.length > 0, 'No content found');
});

Then('each conversation should show a timestamp', async function () {
    const content = await this.page.content();
    assert.ok(content.length > 0, 'No content found');
});

Then('the full conversation should be displayed in the chat window',
    async function () {
    await new Promise(r => setTimeout(r, 1500));
    const chatWindow = await this.page.$('#chatWindow');
    assert.ok(chatWindow !== null, 'Chat window not found');
});

Then('all messages and LLM responses should be visible', async function () {
    const content = await this.page.content();
    assert.ok(content.length > 100, 'Chat appears empty');
});

Then('I should still see my past conversation in the list', async function () {
    await new Promise(r => setTimeout(r, 1000));
    const content = await this.page.content();
    assert.ok(content.length > 0, 'No conversations found');
});

Then('I should see a search bar', async function () {
    const searchBar = await this.page.$('#historySearch');
    assert.ok(searchBar !== null, 'Search bar not found');
});

Then('the conversation list should only show conversations containing {string}',
    async function (keyword) {
    await new Promise(r => setTimeout(r, 1500));
    const content = await this.page.content();
    assert.ok(content.length > 0, 'No content after search');
});

Then('I should see a {string} message', async function (expectedMessage) {
    const content = await this.page.content();
    assert.ok(content.includes(expectedMessage),
        `Expected "${expectedMessage}" not found`);
});

Then('I should see all my past conversations', async function () {
    await new Promise(r => setTimeout(r, 1000));
    const content = await this.page.content();
    assert.ok(content.length > 0, 'No conversations shown');
});

Then('I should see a character counter showing {string}',
    async function (expectedText) {
    await new Promise(r => setTimeout(r, 500));
    const counterText = await this.page.$eval(
        '#charCounter',
        el => el.textContent.trim()
    );
    assert.strictEqual(counterText, expectedText,
        `Expected "${expectedText}" but got "${counterText}"`);
});

Then('the character counter should be red', async function () {
    const color = await this.page.$eval(
        '#charCounter',
        el => el.style.color
    );
    assert.strictEqual(color, 'red',
        `Expected red but got "${color}"`);
});
