const assert = require('assert');
const puppeteer = require('puppeteer');

function apiUrl(path) {
  return `http://localhost:3000/api/v1${path}`;
}

async function withBrowser({ headed }, fn) {
  const browser = await puppeteer.launch({
    headless: headed ? false : 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(15000);
    await fn({ page });
  } finally {
    await browser.close();
  }
}

async function setupApiMocks(page, { email } = {}) {
  await page.setRequestInterception(true);

  page.on('request', (req) => {
    const url = req.url();
    const method = req.method();

    const corsHeaders = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    };

    const respondJson = (status, obj) =>
      req.respond({
        status,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify(obj),
      });

    // Let browser load frontend assets normally
    if (url.startsWith('http://localhost:5500/')) {
      req.continue();
      return;
    }

    // Handle CORS preflight
    if (method === 'OPTIONS' && url.startsWith('http://localhost:3000/api/v1/')) {
      req.respond({ status: 204, headers: corsHeaders, body: '' });
      return;
    }

    // Mock backend API calls used by frontend JS
    if (url === apiUrl('/auth/register') && method === 'POST') {
      respondJson(200, { success: true, data: { userId: 'user-123' } });
      return;
    }

    if (url === apiUrl('/auth/login') && method === 'POST') {
      respondJson(200, {
        success: true,
        data: {
          user: { userId: 'user-123', email: email || 'user@example.com' },
        },
      });
      return;
    }

    if (method === 'GET' && url.startsWith(apiUrl('/inference'))) {
      if (url.includes('/inference/comparisons?')) {
        respondJson(200, {
          success: true,
          data: [],
          pagination: { total: 0, limit: 10, offset: 0 },
        });
        return;
      }
      const comparisonDetail = url.match(/\/inference\/comparisons\/([^/?]+)/);
      if (comparisonDetail) {
        respondJson(200, {
          success: true,
          data: {
            comparisonId: comparisonDetail[1],
            prompt: 'Mock comparison prompt',
            status: 'completed',
            createdAt: new Date().toISOString(),
            results: [
              { model: 'gpt-4', status: 'completed', response: 'Mock A', executionTimeMs: 10, errorMessage: null },
              { model: 'claude-v1', status: 'completed', response: 'Mock B', executionTimeMs: 12, errorMessage: null },
            ],
          },
        });
        return;
      }
      if (url.includes('/inference?')) {
        respondJson(200, { success: true, data: [] });
        return;
      }
      respondJson(200, {
        success: true,
        data: {
          inferenceId: 'inf-123',
          prompt: 'Test prompt',
          status: 'completed',
          response: 'Test response',
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        },
      });
      return;
    }

    if (method === 'DELETE' && url.startsWith(apiUrl('/inference/comparisons/'))) {
      respondJson(200, { success: true, message: 'Comparison deleted successfully' });
      return;
    }

    if (url === apiUrl('/inference/compare') && method === 'POST') {
      respondJson(201, {
        success: true,
        data: {
          comparisonId: 'cmp-e2e',
          prompt: 'Explain photosynthesis simply',
          status: 'completed',
          createdAt: new Date().toISOString(),
          results: [
            { model: 'gpt-4', status: 'completed', response: 'Mock gpt-4', executionTimeMs: 8, errorMessage: null },
            { model: 'claude-v1', status: 'completed', response: 'Mock claude', executionTimeMs: 9, errorMessage: null },
          ],
        },
      });
      return;
    }

    if (url === apiUrl('/inference/submit') && method === 'POST') {
      respondJson(200, {
        success: true,
        data: { inferenceId: 'inf-123', status: 'pending' },
      });
      return;
    }

    // Any unexpected network call should fail the test loudly
    respondJson(500, { success: false, message: `Unmocked request: ${method} ${url}` });
  });
}

async function testDashboardRedirectsToLoginWhenNotAuthenticated({ page }) {
  await page.goto('http://localhost:5500/dashboard.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.location.href.includes('login.html'));
  assert.ok(page.url().includes('login.html'));
}

async function testSignupRejectsWeakPasswordClientSide({ page }) {
  await page.goto('http://localhost:5500/signup.html', { waitUntil: 'domcontentloaded' });

  await page.type('#email', `weak_${Date.now()}@example.com`);
  await page.type('#password', 'weak');
  await page.click('button[type="submit"]');

  await page.waitForSelector('#passwordError.show', { visible: true });
  const msg = await page.$eval('#passwordError', (el) => el.textContent || '');
  assert.ok(msg.toLowerCase().includes('password must contain'));
}

async function testSignupSuccessRedirectsToDashboardAndShowsUser({ page }) {
  const email = `e2e_${Date.now()}@example.com`;
  await setupApiMocks(page, { email });

  await page.goto('http://localhost:5500/signup.html', { waitUntil: 'domcontentloaded' });
  await page.type('#email', email);
  await page.type('#password', 'ValidPass123!');
  await page.click('button[type="submit"]');

  // Redirect occurs via setTimeout; wait for dashboard
  await page.waitForFunction(() => window.location.href.includes('dashboard.html'), { timeout: 20000 });
  await page.waitForSelector('#userName');

  const displayed = await page.$eval('#userName', (el) => (el.textContent || '').trim());
  assert.strictEqual(displayed, email);

  const storedUser = await page.evaluate(() => localStorage.getItem('user'));
  assert.ok(storedUser, 'Expected user session to be set in localStorage');
}

async function testLoginSuccessRedirectsToDashboard({ page }) {
  const email = `login_${Date.now()}@example.com`;
  await setupApiMocks(page, { email });

  await page.goto('http://localhost:5500/login.html', { waitUntil: 'domcontentloaded' });
  await page.type('#email', email);
  await page.type('#password', 'ValidPass123!');
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => window.location.href.includes('dashboard.html'), { timeout: 20000 });
  const displayed = await page.$eval('#userName', (el) => (el.textContent || '').trim());
  assert.strictEqual(displayed, email);
}

async function testDashboardCompareSubmitsTwoModels({ page }) {
  const email = `compare_${Date.now()}@example.com`;
  await setupApiMocks(page, { email });

  await page.goto('http://localhost:5500/login.html', { waitUntil: 'domcontentloaded' });
  await page.type('#email', email);
  await page.type('#password', 'ValidPass123!');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.href.includes('dashboard.html'), { timeout: 20000 });

  await page.click('[data-mode="compare"]');
  await page.waitForSelector('#compareModeContainer:not(.hidden)');

  await page.click('input[name="compareModel"][value="gpt-4"]');
  await page.click('input[name="compareModel"][value="claude-v1"]');
  await page.type('#comparePromptInput', 'Explain photosynthesis simply');
  await page.click('#compareForm button[type="submit"]');

  await page.waitForSelector('.comparison-card[data-model="gpt-4"] .response-text');
  await page.waitForSelector('.comparison-card[data-model="claude-v1"] .response-text');
}

async function runAll({ headed = false } = {}) {
  const tests = [
    ['Dashboard redirects to login without token', testDashboardRedirectsToLoginWhenNotAuthenticated],
    ['Signup rejects weak password client-side', testSignupRejectsWeakPasswordClientSide],
    ['Signup success redirects and displays user', testSignupSuccessRedirectsToDashboardAndShowsUser],
    ['Login success redirects and displays user', testLoginSuccessRedirectsToDashboard],
    ['Dashboard compare mode submits two models', testDashboardCompareSubmitsTwoModels],
  ];

  for (const [name, fn] of tests) {
    // eslint-disable-next-line no-console
    console.log(`\n[E2E] ${name}`);
    await withBrowser({ headed }, fn);
    // eslint-disable-next-line no-console
    console.log(`[E2E] PASS: ${name}`);
  }
}

module.exports = { runAll };
