/**
 * Cucumber step definitions — driven by Puppeteer
 *
 * Prerequisites:
 *   1. Server must be running:  npm start
 *   2. Run acceptance tests:    npm run test:cucumber
 */

const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const puppeteer = require('puppeteer');
const assert = require('assert');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

let browser;
let page;

// ── Lifecycle ─────────────────────────────────────────────────────────────────

Before(async function () {
    // Clean up test account so signup scenario can always run fresh
    const client = new MongoClient(process.env.MONGO_URI, {
        serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
    });
    try {
        await client.connect();
        await client.db('dbs').collection('userLoginData').deleteOne({ email: 'testuser@example.com' });
    } finally {
        await client.close();
    }

    this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
});

After(async function () {
    if (this.browser) await this.browser.close();
});

// ── Given ─────────────────────────────────────────────────────────────────────

Given('I navigate to the home page', async function () {
    await this.page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
});

Given('I am on the sign up page', async function () {
    await this.page.goto(`${BASE_URL}/signUp.html`, { waitUntil: 'domcontentloaded' });
});

Given('I am on the login page', async function () {
    await this.page.goto(`${BASE_URL}/logIn.html`, { waitUntil: 'domcontentloaded' });
});

// ── When ──────────────────────────────────────────────────────────────────────

When('I fill in {string} with {string}', async (fieldId, value) => {
    await page.$eval(`#${fieldId}`, el => { el.value = ''; });
    if (value !== '') {
        await page.type(`#${fieldId}`, value);
    }
});

When('I click the {string} button', async (buttonText) => {
    // Find a button whose visible text matches
    const buttons = await page.$$('button');
    for (const btn of buttons) {
        const text = await page.evaluate(el => el.innerText.trim(), btn);
        if (text === buttonText) {
            await btn.click();
            // Small wait for async fetch + DOM update
            await new Promise(r => setTimeout(r, 2000));
            return;
        }
    }
    throw new Error(`Button with text "${buttonText}" not found`);
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the page title should contain {string}', async (expectedTitle) => {
    const title = await page.title();
    assert.ok(title.includes(expectedTitle), `Expected title to contain "${expectedTitle}", got "${title}"`);
});

Then('I should see a {string} link in the navigation', async (linkText) => {
    const links = await page.$$('nav a');
    for (const link of links) {
        const text = await page.evaluate(el => el.innerText.trim(), link);
        if (text === linkText) return;
    }
    throw new Error(`Nav link "${linkText}" not found`);
});

Then('I should see a {string} link', async (linkText) => {
    const content = await page.content();
    assert.ok(content.includes(linkText), `Expected to find link text "${linkText}" on page`);
});

Then('I should see the login form', async () => {
    await page.waitForSelector('#existingUserEmail');
    await page.waitForSelector('#existingUserPassword');
});

Then('I should be redirected to the home page', async () => {
    // After redirect, URL should be BASE_URL or BASE_URL/
    await page.waitForFunction(
        (base) => window.location.href === base + '/' || window.location.href === base,
        { timeout: 3000 },
        BASE_URL
    );
});

Then('I should see an error message {string}', async (expectedMessage) => {
    const errText = await page.$eval('#errorMessage', el => el.innerText.trim());
    assert.strictEqual(errText, expectedMessage,
        `Expected error "${expectedMessage}", got "${errText}"`);
});
