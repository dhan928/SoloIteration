const assert = require('assert');
const puppeteer = require('puppeteer');

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

// Test 1: Dashboard redirects to login
async function testDashboardRedirectsToLoginWhenNotAuthenticated({ page }) {
  await page.goto('http://localhost:5500/dashboard.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.location.href.includes('login.html'));
  assert.ok(page.url().includes('login.html'));
}

// Test 2: Signup rejects weak password
async function testSignupRejectsWeakPasswordClientSide({ page }) {
  await page.goto('http://localhost:5500/signup.html', { waitUntil: 'domcontentloaded' });

  await page.type('#email', `weak_${Date.now()}@example.com`);
  await page.type('#password', 'weak');
  await page.click('button[type="submit"]');

  await page.waitForSelector('#passwordError.show', { visible: true });
  const msg = await page.$eval('#passwordError', (el) => el.textContent || '');
  assert.ok(msg.toLowerCase().includes('password must contain'));
}

// Test 3: Signup with real backend
async function testSignupWithRealBackend({ page }) {
  const email = `real_signup_${Date.now()}@example.com`;
  const password = 'RealTest123!';

  console.log(`    Testing signup with email: ${email}`);

  await page.goto('http://localhost:5500/signup.html', { waitUntil: 'domcontentloaded' });
  await page.type('#email', email);
  await page.type('#password', password);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForFunction(
    () => window.location.href.includes('dashboard.html'),
    { timeout: 20000 }
  );

  // Verify user is logged in
  await page.waitForSelector('#userName');
  const displayed = await page.$eval('#userName', (el) => (el.textContent || '').trim());
  assert.ok(displayed.includes(email), `Expected "${email}" to be displayed, got "${displayed}"`);
  console.log(`    ✅ User logged in as: ${displayed}`);
}

// Test 4: Login with real backend
async function testLoginWithRealBackend({ page }) {
  // First, create an account
  const email = `real_login_${Date.now()}@example.com`;
  const password = 'RealTest123!';

  console.log(`    Creating account and testing login with email: ${email}`);

  // Sign up
  await page.goto('http://localhost:5500/signup.html', { waitUntil: 'domcontentloaded' });
  await page.type('#email', email);
  await page.type('#password', password);
  await page.click('button[type="submit"]');

  // Wait for auto-login redirect
  await page.waitForFunction(() => window.location.href.includes('dashboard.html'), {
    timeout: 20000,
  });

  // Log out
  const logoutBtn = await page.$('button:has-text("Logout")') || 
                     await page.$('button[onclick*="logout"]') ||
                     await page.$('a[onclick*="logout"]');
  if (logoutBtn) {
    await logoutBtn.click();
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
  }

  // Now log in with same credentials
  await page.goto('http://localhost:5500/login.html', { waitUntil: 'domcontentloaded' });
  await page.type('#email', email);
  await page.type('#password', password);
  await page.click('button[type="submit"]');

  // Verify login
  await page.waitForFunction(() => window.location.href.includes('dashboard.html'), {
    timeout: 20000,
  });
  const displayed = await page.$eval('#userName', (el) => (el.textContent || '').trim());
  assert.ok(displayed.includes(email), `Expected "${email}" in display, got "${displayed}"`);
  console.log(`    ✅ Login successful as: ${displayed}`);
}

// Test 5: Compare models workflow (if implemented)
async function testCompareModelsWorkflow({ page }) {
  // Sign up first
  const email = `compare_${Date.now()}@example.com`;
  const password = 'RealTest123!';

  console.log(`    Testing compare workflow with email: ${email}`);

  await page.goto('http://localhost:5500/signup.html', { waitUntil: 'domcontentloaded' });
  await page.type('#email', email);
  await page.type('#password', password);
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => window.location.href.includes('dashboard.html'), {
    timeout: 20000,
  });

  // Try to access compare mode
  const compareBtn = await page.$('[data-mode="compare"]');
  if (compareBtn) {
    await compareBtn.click();
    await page.waitForSelector('#compareModeContainer:not(.hidden)', { timeout: 5000 });
    console.log(`    ✅ Compare mode accessible`);
  } else {
    console.log(`    ⚠️  Compare mode button not found (may not be implemented)`);
  }
}

// Test 6: Verify frontend loads
async function testFrontendLoads({ page }) {
  console.log('    Testing frontend availability');
  await page.goto('http://localhost:5500/index.html', { waitUntil: 'domcontentloaded' });
  const title = await page.title();
  assert.ok(title, 'Page should have a title');
  console.log(`    ✅ Frontend loaded: "${title}"`);
}

async function runAll({ headed = false } = {}) {
  const tests = [
    ['Frontend loads', testFrontendLoads],
    ['Dashboard redirects to login without token', testDashboardRedirectsToLoginWhenNotAuthenticated],
    ['Signup rejects weak password client-side', testSignupRejectsWeakPasswordClientSide],
    ['Signup with real backend', testSignupWithRealBackend],
    ['Login with real backend', testLoginWithRealBackend],
    ['Compare models workflow', testCompareModelsWorkflow],
  ];

  const results = {
    passed: 0,
    failed: 0,
    errors: [],
  };

  console.log('\n' + '='.repeat(70));
  console.log('         REAL INTEGRATION E2E TEST SUITE');
  console.log('         (Tests against REAL servers - no mocking)');
  console.log('='.repeat(70));

  for (const [name, fn] of tests) {
    try {
      console.log(`\n⏳ Running: ${name}`);
      await withBrowser({ headed }, fn);
      console.log(`✅ PASS: ${name}`);
      results.passed++;
    } catch (err) {
      console.log(`❌ FAIL: ${name}`);
      console.log(`   Error: ${err.message}`);
      results.failed++;
      results.errors.push({ test: name, error: err.message });
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('         TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total:  ${tests.length}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log('='.repeat(70) + '\n');

  if (results.failed > 0) {
    console.log('FAILED TESTS:');
    results.errors.forEach(({ test, error }) => {
      console.log(`  - ${test}: ${error}`);
    });
    console.log();
  }

  return results.failed === 0;
}

module.exports = { runAll };
