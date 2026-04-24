const { Given, When, Then, Before } = require('@cucumber/cucumber');
const assert = require('assert');
const { isValidEmail, isValidPassword } = require('../../src/utils/validators');
const { validateComparisonInput } = require('../../src/utils/comparisonValidators');

Before(function () {
  this.users = [];
  this.lastRegistration = null;
  this.lastLogin = null;
  this.lastComparison = null;
  this.lastError = null;
  this.currentUser = null;
});

Given('I am a new visitor', function () {
  this.currentUser = null;
});

When(
  'I register with email {string} and password {string}',
  function (email, password) {
    this.lastError = null;
    this.lastRegistration = null;

    if (!isValidEmail(email)) {
      this.lastError = 'Invalid email format';
      return;
    }

    if (!isValidPassword(password)) {
      this.lastError = 'Password does not meet requirements';
      return;
    }

    const exists = this.users.find((user) => user.email === email);
    if (exists) {
      this.lastError = 'Email already exists';
      return;
    }

    this.lastRegistration = {
      userId: `user-${this.users.length + 1}`,
      email
    };
    this.users.push({
      userId: this.lastRegistration.userId,
      email,
      password
    });
  }
);

Then('the registration should succeed', function () {
  assert(this.lastRegistration, 'Expected registration to succeed');
  assert.strictEqual(this.lastError, null);
});

Then('the created user email should be {string}', function (email) {
  assert(this.lastRegistration, 'Expected a created user');
  assert.strictEqual(this.lastRegistration.email, email);
});

Given(
  'a registered user with email {string} and password {string}',
  function (email, password) {
    this.users.push({
      userId: `user-${this.users.length + 1}`,
      email,
      password
    });
  }
);

When('I log in with email {string} and password {string}', function (email, password) {
  this.lastError = null;
  this.lastLogin = null;

  const user = this.users.find((entry) => entry.email === email);
  if (!user || user.password !== password) {
    this.lastError = 'Invalid credentials';
    return;
  }

  this.lastLogin = {
    user: {
      userId: user.userId,
      email: user.email
    }
  };
  this.currentUser = this.lastLogin.user;
});

Then('the login should succeed', function () {
  assert(this.lastLogin, 'Expected login to succeed');
  assert.strictEqual(this.lastError, null);
});

Then('the logged in user email should be {string}', function (email) {
  assert(this.lastLogin, 'Expected a logged in user');
  assert.strictEqual(this.lastLogin.user.email, email);
});

Given('a logged-in user with id {string}', function (userId) {
  this.currentUser = {
    userId,
    email: 'student@example.com'
  };
});

When(
  'I submit a comparison prompt {string} to models {string}',
  function (prompt, modelList) {
    this.lastError = null;
    this.lastComparison = null;

    const models = modelList.split(',').map((item) => item.trim()).filter(Boolean);
    const validation = validateComparisonInput(prompt, models);

    if (!validation.isValid) {
      this.lastError = validation.errors.join('; ');
      return;
    }

    this.lastComparison = {
      prompt,
      results: models.map((model) => ({
        model,
        status: 'completed',
        response: `Simulated response from ${model}`
      }))
    };
  }
);

Then('the comparison should succeed', function () {
  assert(this.lastComparison, 'Expected comparison to succeed');
  assert.strictEqual(this.lastError, null);
});

Then('the comparison should include {int} model results', function (count) {
  assert(this.lastComparison, 'Expected comparison results');
  assert.strictEqual(this.lastComparison.results.length, count);
});

Then('the comparison should fail validation', function () {
  assert.strictEqual(this.lastComparison, null);
  assert(this.lastError, 'Expected a validation error');
});
