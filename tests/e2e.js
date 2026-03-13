/**
 * Puppeteer end-to-end demo script
 *
 * Records a visible browser session walking through the full auth flow.
 * Use this for the 1-minute screen recording required by the Testing Team rubric.
 *
 * Prerequisites:
 *   Server must be running:  npm start
 *
 * Run:
 *   npm run test:e2e
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

// Unique email so the test account doesn't conflict on repeat runs
const TEST_EMAIL    = `e2e_${Date.now()}@example.com`;
const TEST_NAME     = 'E2ETestUser';
const TEST_PASSWORD = 'testpassword99';

async function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function pass(label) {
    console.log(`  ✓  ${label}`);
}

async function fail(label, err) {
    console.error(`  ✗  ${label}`);
    console.error('     ', err.message);
}

// ── Test runner ───────────────────────────────────────────────────────────────
(async () => {
    const browser = await puppeteer.launch({
        headless: false,            // Set true for CI; false shows the browser for the demo video
        defaultViewport: { width: 1280, height: 800 },
        slowMo: 60                  // Slow down actions so they're visible in the recording
    });

    const page = await browser.newPage();
    let passed = 0;
    let failed = 0;

    // ── Test 1: Landing page loads ────────────────────────────────────────────
    try {
        await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
        const title = await page.title();
        if (!title.includes('Frog Prompt')) throw new Error(`Unexpected title: ${title}`);
        await pass('Landing page loads with correct title');
        passed++;
    } catch (e) {
        await fail('Landing page loads', e);
        failed++;
    }

    await delay(1000);

    // ── Test 2: Navigate to Sign Up page ──────────────────────────────────────
    try {
        await page.goto(`${BASE_URL}/signUp.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#newUserName');
        await pass('Sign Up page loads with form fields');
        passed++;
    } catch (e) {
        await fail('Navigate to Sign Up page', e);
        failed++;
    }

    await delay(500);

    // ── Test 3: Client-side validation — empty username ───────────────────────
    try {
        await page.$eval('#newUserName', el => { el.value = ''; });
        await page.$eval('#newUserEmail', el => { el.value = 'a@b.com'; });
        await page.type('#newUserPassword1', 'password123');
        await page.type('#newUserPassword2', 'password123');

        // Click Sign Up button
        const buttons = await page.$$('button');
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.innerText, btn);
            if (text.trim() === 'Sign Up') { await btn.click(); break; }
        }
        await delay(500);

        const errText = await page.$eval('#errorMessage', el => el.innerText.trim());
        if (errText !== 'Username cannot be empty.') throw new Error(`Got: "${errText}"`);
        await pass('Client validation: rejects empty username');
        passed++;
    } catch (e) {
        await fail('Client validation: empty username', e);
        failed++;
    }

    await delay(500);

    // ── Test 4: Client-side validation — mismatched passwords ────────────────
    try {
        await page.$eval('#newUserName', el => { el.value = 'TestUser'; });
        await page.$eval('#newUserPassword1', el => { el.value = 'password123'; });
        await page.$eval('#newUserPassword2', el => { el.value = 'differentpass'; });

        const buttons = await page.$$('button');
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.innerText, btn);
            if (text.trim() === 'Sign Up') { await btn.click(); break; }
        }
        await delay(500);

        const errText = await page.$eval('#errorMessage', el => el.innerText.trim());
        if (errText !== 'Passwords do not match.') throw new Error(`Got: "${errText}"`);
        await pass('Client validation: rejects mismatched passwords');
        passed++;
    } catch (e) {
        await fail('Client validation: mismatched passwords', e);
        failed++;
    }

    await delay(500);

    // ── Test 5: Successful sign up ────────────────────────────────────────────
    try {
        await page.$eval('#newUserName',      (el, val) => { el.value = val; }, TEST_NAME);
        await page.$eval('#newUserEmail',     (el, val) => { el.value = val; }, TEST_EMAIL);
        await page.$eval('#newUserPassword1', (el, val) => { el.value = val; }, TEST_PASSWORD);
        await page.$eval('#newUserPassword2', (el, val) => { el.value = val; }, TEST_PASSWORD);

        const buttons = await page.$$('button');
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.innerText, btn);
            if (text.trim() === 'Sign Up') { await btn.click(); break; }
        }

        await page.waitForFunction(
            (base) => window.location.href === base + '/' || window.location.href === base,
            { timeout: 5000 },
            BASE_URL
        );
        await pass('Successful sign up redirects to home page');
        passed++;
    } catch (e) {
        await fail('Successful sign up', e);
        failed++;
    }

    await delay(1000);

    // ── Test 6: Navigate to Login page ───────────────────────────────────────
    try {
        await page.goto(`${BASE_URL}/logIn.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#existingUserEmail');
        await page.waitForSelector('#existingUserPassword');
        await pass('Login page loads with email and password fields');
        passed++;
    } catch (e) {
        await fail('Navigate to Login page', e);
        failed++;
    }

    await delay(500);

    // ── Test 7: Login with wrong credentials ─────────────────────────────────
    try {
        await page.type('#existingUserEmail',    'nobody@example.com');
        await page.type('#existingUserPassword', 'wrongpassword');

        const buttons = await page.$$('button');
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.innerText, btn);
            if (text.trim() === 'Login') { await btn.click(); break; }
        }
        await delay(800);

        const errText = await page.$eval('#errorMessage', el => el.innerText.trim());
        if (errText !== 'Invalid email or password.') throw new Error(`Got: "${errText}"`);
        await pass('Login with wrong credentials shows error');
        passed++;
    } catch (e) {
        await fail('Login with wrong credentials', e);
        failed++;
    }

    await delay(500);

    // ── Test 8: Login with correct credentials ────────────────────────────────
    try {
        await page.$eval('#existingUserEmail',    (el, val) => { el.value = val; }, TEST_EMAIL);
        await page.$eval('#existingUserPassword', (el, val) => { el.value = val; }, TEST_PASSWORD);

        const buttons = await page.$$('button');
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.innerText, btn);
            if (text.trim() === 'Login') { await btn.click(); break; }
        }

        await page.waitForFunction(
            (base) => window.location.href === base + '/' || window.location.href === base,
            { timeout: 5000 },
            BASE_URL
        );
        await pass('Login with correct credentials redirects to home page');
        passed++;
    } catch (e) {
        await fail('Login with correct credentials', e);
        failed++;
    }

    await delay(1000);

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log(`\nResults: ${passed} passed, ${failed} failed`);

    await delay(2000);
    await browser.close();

    if (failed > 0) process.exit(1);
})();
