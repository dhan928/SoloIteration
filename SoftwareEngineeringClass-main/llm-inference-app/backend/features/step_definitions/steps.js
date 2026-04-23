const { Given, When, Then, After, setDefaultTimeout } = require('@cucumber/cucumber');
const puppeteer = require('puppeteer');

// giving extra time since puppeteer can be slow
setDefaultTimeout(60000);

let browser, page, isSignup;

Given('I am a new user who is not logged in', async () => {
  browser = await puppeteer.launch({ headless: false, slowMo: 50 });
  page = await browser.newPage();
});

After(async () => {
  if (browser) await browser.close();
});

When('I navigate to the home URL', async () => {
  await page.goto('http://localhost:5500/index.html', { waitUntil: 'networkidle0' });
});

// checks if the text shows up anywhere on the page
Then('I should see {string} on the page', async (text) => {
  await page.waitForFunction(
    (t) => document.body.innerText.includes(t),
    { timeout: 5000 },
    text
  );
});

Given('I am on the Login page', async () => {
  browser = await puppeteer.launch({ headless: false, slowMo: 50 });
  page = await browser.newPage();
  isSignup = false;
  await page.goto('http://localhost:5500/login.html', { waitUntil: 'networkidle0' });
});

When('I enter a valid email and password', async () => {
  // use a unique email for signup, fixed email for login
  const email = isSignup ? `testuser_${Date.now()}@example.com` : 'cucumber_test@example.com';
  await page.waitForSelector('input[type="email"]', { timeout: 5000 });
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', 'Test@1234');
});

When('I click the Login button', async () => {
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 3000));
});

Then('I should be redirected to my dashboard', async () => {
  const url = page.url();
  if (!url.includes('dashboard')) {
    throw new Error(`Expected dashboard URL but got: ${url}`);
  }
});

Given('I am on the Create Account page', async () => {
  browser = await puppeteer.launch({ headless: false, slowMo: 50 });
  page = await browser.newPage();
  isSignup = true;
  await page.goto('http://localhost:5500/signup.html', { waitUntil: 'networkidle0' });
});

When('I click Submit', async () => {
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 3000));
});

Then('my account should be created', async () => {
  const url = page.url();
  if (!url.includes('dashboard')) {
    throw new Error(`Account creation did not redirect to dashboard`);
  }
});

Then('I should be logged into the app', async () => {
  const url = page.url();
  if (!url.includes('dashboard')) {
    throw new Error(`Expected to be logged in but URL was: ${url}`);
  }
});

// --- Iteration 3 steps below ---

// logs in and lands on dashboard before each iteration 3 test
Given('I am logged in and on the dashboard', async () => {
  browser = await puppeteer.launch({ headless: false, slowMo: 50 });
  page = await browser.newPage();
  await page.goto('http://localhost:5500/login.html', { waitUntil: 'networkidle0' });
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'cucumber_test@example.com');
  await page.type('input[type="password"]', 'Test@1234');
  await page.click('button[type="submit"]');
  // wait for redirect to dashboard
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
});

// US1 - model selector should be on the dashboard
Then('I should see a model selector on the page', async () => {
  await page.waitForSelector('#modelSelector', { timeout: 5000 });
});

When('I select a model from the dropdown', async () => {
  await page.waitForSelector('#modelSelector', { timeout: 5000 });
  await page.select('#modelSelector', 'gpt-4');
});

Then('the selected model should be displayed', async () => {
  const val = await page.$eval('#modelSelector', el => el.value);
  if (!val) throw new Error('No model was selected');
});

// US2 - local model
Then('I should see a local model option in the selector', async () => {
  await page.waitForSelector('#modelSelector', { timeout: 5000 });
  const html = await page.$eval('#modelSelector', el => el.innerHTML);
  if (!html.includes('local') && !html.includes('llama') && !html.includes('ollama')) {
    throw new Error('Could not find a local model in the dropdown');
  }
});

When('I select a local model', async () => {
  await page.waitForSelector('#modelSelector', { timeout: 5000 });
  // just pick the first option that looks local
  const options = await page.$$eval('#modelSelector option', opts => opts.map(o => o.value));
  const local = options.find(o => o.includes('local') || o.includes('llama') || o.includes('ollama'));
  await page.select('#modelSelector', local);
});

// US3 - public model
Then('I should see a public model option in the selector', async () => {
  await page.waitForSelector('#modelSelector', { timeout: 5000 });
  const html = await page.$eval('#modelSelector', el => el.innerHTML);
  if (!html.includes('gpt') && !html.includes('gemini') && !html.includes('claude')) {
    throw new Error('Could not find a public model in the dropdown');
  }
});

When('I select a public model', async () => {
  await page.waitForSelector('#modelSelector', { timeout: 5000 });
  const options = await page.$$eval('#modelSelector option', opts => opts.map(o => o.value));
  const pub = options.find(o => o.includes('gpt') || o.includes('gemini') || o.includes('claude'));
  await page.select('#modelSelector', pub);
});

// shared steps for US2-5
When('I type {string} in the message input', async (text) => {
  await page.waitForSelector('#promptInput', { timeout: 5000 });
  await page.type('#promptInput', text);
});

When('I click the send button', async () => {
  await page.click('.btn-send');
  // wait a few seconds for the LLM to respond
  await new Promise(r => setTimeout(r, 5000));
});

// checks that at least one assistant message appeared
Then('I should see a response in the chat', async () => {
  const found = await page.evaluate(() => {
    const msgs = document.querySelectorAll('.message, .chat-message, .assistant-message');
    return msgs.length > 0;
  });
  if (!found) throw new Error('No response showed up in the chat');
});
