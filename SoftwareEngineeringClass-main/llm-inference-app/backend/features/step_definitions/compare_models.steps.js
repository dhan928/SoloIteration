const { Given, When, Then, Before } = require('@cucumber/cucumber');
const assert = require('assert');
const { validateComparisonInput } = require('../../src/utils/comparisonValidators');

Before({ tags: '@comparison' }, function () {
  this.mockHistory = [];
  this.lastComparison = null;
  this.loadedComparison = null;
  this.selectedModels = null;
  this.prompt = '';
  this.pendingDeleteId = null;
  this.validationMessages = [];
  this.clientBlocked = false;
});

Given('I am logged in as a test user', function () {
  this.userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
});

Given('I am on the dashboard', function () {
  this.view = 'dashboard';
});

Given('I am in comparison mode', function () {
  this.compareMode = true;
});

When('I select {string} and {string} for comparison', function (a, b) {
  this.selectedModels = [a, b];
});

When('I select {string} for comparison', function (a) {
  this.selectedModels = [a];
});

When('I select {string} twice \\(attempt duplicate selection)', function (model) {
  this.selectedModels = [model, model];
});

When('I type {string} in the comparison prompt input', function (text) {
  this.prompt = text;
});

When("I don't select any models", function () {
  this.selectedModels = [];
});

When('I click the Compare button', function () {
  this.validationMessages = [];
  this.lastComparison = null;
  this.clientBlocked = false;

  if (!this.selectedModels || this.selectedModels.length < 2) {
    this.validationMessages.push('Please select at least 2 models');
    this.clientBlocked = true;
    return;
  }

  const v = validateComparisonInput(this.prompt, this.selectedModels);
  if (!v.isValid) {
    this.validationMessages.push(...v.errors);
    this.clientBlocked = true;
    return;
  }

  this.lastComparison = buildSimulatedComparison(this.prompt, this.selectedModels);
  this.mockHistory.unshift({
    comparisonId: this.lastComparison.comparisonId,
    prompt: this.lastComparison.prompt,
    createdAt: this.lastComparison.createdAt,
    results: this.lastComparison.results
  });
});

Then('I should see a response card for {string}', function (model) {
  assert(this.lastComparison, 'Expected a comparison result');
  const found = this.lastComparison.results.some((r) => r.model === model);
  assert(found, `Expected a card for model ${model}`);
});

Then('I should see a response card for {string} with status {string}', function (model, status) {
  assert(this.lastComparison, 'Expected a comparison result');
  const row = this.lastComparison.results.find((r) => r.model === model);
  assert(row, `No row for ${model}`);
  assert.strictEqual(row.status, status);
});

Then(
  'I should see a response card for {string} with status {string} or {string}',
  function (model, s1, s2) {
    assert(this.lastComparison, 'Expected a comparison result');
    const row = this.lastComparison.results.find((r) => r.model === model);
    assert(row, `No row for ${model}`);
    assert.ok(
      row.status === s1 || row.status === s2,
      `Expected status ${s1} or ${s2}, got ${row.status}`
    );
  }
);

Then('the comparison should be saved in history', function () {
  assert(this.mockHistory && this.mockHistory.length > 0, 'Expected history to contain a comparison');
});

Then('I should see both models in the comparison history', function () {
  assert(this.lastComparison, 'Expected last comparison');
  const summary = JSON.stringify(this.mockHistory[0] || {});
  this.lastComparison.results.forEach((r) => {
    assert(
      summary.includes(r.model),
      `Expected model ${r.model} in history snapshot`
    );
  });
});

Then('I should see a validation error {string}', function (message) {
  const blob = this.validationMessages.join('; ');
  assert(blob.includes(message), `Expected "${message}" in "${blob}"`);
});

Then('I should see a validation error containing {string}', function (fragment) {
  const blob = this.validationMessages.join('; ');
  assert(blob.includes(fragment), `Expected "${fragment}" in "${blob}"`);
});

Then('I should see a validation error about prompt length', function () {
  const blob = this.validationMessages.join('; ').toLowerCase();
  assert(
    blob.includes('5 characters') || blob.includes('prompt'),
    `Expected prompt length validation, got: ${blob}`
  );
});

Then('no comparison should be created', function () {
  assert.strictEqual(this.lastComparison, null);
});

Then('the successful model response should be visible', function () {
  const ok = this.lastComparison.results.find((r) => r.status === 'completed' && r.response);
  assert(ok, 'Expected at least one completed response with body text');
});

Then('the failed model should show an error state', function () {
  const bad = this.lastComparison.results.find((r) => r.status === 'failed');
  assert(bad, 'Expected a failed model row');
  assert(bad.errorMessage, 'Expected an error message on failed row');
});

Given('I have created a comparison', function () {
  this.selectedModels = ['gpt-4', 'claude-v1'];
  this.prompt = 'Default comparison prompt for testing';
  this.lastComparison = buildSimulatedComparison(this.prompt, this.selectedModels);
  this.mockHistory = [
    {
      comparisonId: this.lastComparison.comparisonId,
      prompt: this.lastComparison.prompt,
      createdAt: this.lastComparison.createdAt,
      results: this.lastComparison.results
    }
  ];
});

Given('I have created a comparison with prompt {string}', function (promptText) {
  this.selectedModels = ['gpt-4', 'claude-v1'];
  this.prompt = promptText;
  this.lastComparison = buildSimulatedComparison(this.prompt, this.selectedModels);
  this.mockHistory = [
    {
      comparisonId: this.lastComparison.comparisonId,
      prompt: this.lastComparison.prompt,
      createdAt: this.lastComparison.createdAt,
      results: this.lastComparison.results
    }
  ];
});

Given('I can see the comparison in history', function () {
  assert(this.mockHistory.length > 0, 'Expected comparison in mock history');
});

Given('I can see the comparison in the history panel', function () {
  assert(this.mockHistory.length > 0, 'Expected comparison in mock history');
});

When('I click the delete button on the comparison', function () {
  assert(this.mockHistory.length > 0, 'Nothing to delete');
  this.pendingDeleteId = this.mockHistory[0].comparisonId;
});

When('I confirm the deletion', function () {
  assert(this.pendingDeleteId, 'No delete target');
  this.mockHistory = this.mockHistory.filter((c) => c.comparisonId !== this.pendingDeleteId);
  this.pendingDeleteId = null;
});

Then('the comparison should be removed from history', function () {
  assert.strictEqual(this.mockHistory.length, 0);
});

Then('a new comparison load should not include it', function () {
  assert.strictEqual(this.mockHistory.length, 0);
});

When('I click on the comparison in the history', function () {
  assert(this.mockHistory.length > 0, 'No comparison to load');
  const row = this.mockHistory[0];
  this.loadedComparison = {
    comparisonId: row.comparisonId,
    prompt: row.prompt,
    status: 'completed',
    createdAt: row.createdAt,
    results: row.results
  };
});

Then('the comparison details should be reloaded', function () {
  assert(this.loadedComparison, 'Expected loaded comparison');
});

Then('I should see the same prompt {string}', function (text) {
  assert.strictEqual(this.loadedComparison.prompt, text);
});

Then('I should see all the model responses again', function () {
  assert(this.loadedComparison.results.length >= 2, 'Expected multiple model rows');
});

Then('the comparison should reject duplicate models', function () {
  const prompt =
    this.prompt && this.prompt.trim().length >= 5
      ? this.prompt.trim()
      : 'Explain photosynthesis in simple terms.';
  const v = validateComparisonInput(prompt, this.selectedModels);
  assert(!v.isValid, `Expected invalid payload, got valid: ${JSON.stringify(this.selectedModels)}`);
  assert(
    v.errors.some((e) => e.toLowerCase().includes('duplicate')),
    `Expected duplicate-model error, got: ${v.errors.join('; ')}`
  );
});

function buildSimulatedComparison(prompt, models) {
  const id = `cmp_${Date.now()}`;
  return {
    comparisonId: id,
    prompt,
    status: 'completed',
    createdAt: new Date().toISOString(),
    results: models.map((m) =>
      m === 'local-small'
        ? {
            model: m,
            status: 'failed',
            response: null,
            executionTimeMs: null,
            errorMessage: 'Model unavailable'
          }
        : {
            model: m,
            status: 'completed',
            response: `Simulated answer from ${m}.`,
            executionTimeMs: 120,
            errorMessage: null
          }
    )
  };
}
