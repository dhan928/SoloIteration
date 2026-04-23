/**
 * Cucumber Hooks
 * Used for setup and teardown across all scenarios
 */

const { Before, After, BeforeAll, AfterAll } = require('@cucumber/cucumber');

/**
 * Runs once before any scenario
 */
BeforeAll(function() {
  console.log('\n🧪 Starting test suite...\n');
  
  // Initialize test environment
  process.env.NODE_ENV = 'test';
});

/**
 * Runs before each scenario
 */
Before(function(scenario) {
  // Reset scenario-specific state
  this.scenarioData = {};
  this.testUsers = {};
  this.lastResponse = null;
  this.lastError = null;
  
  const scenarioName = scenario?.pickle?.name || 'Unknown';
  console.log(`\n📋 Scenario: ${scenarioName}`);
});

/**
 * After each scenario, regardless of pass/fail
 */
After(function(scenario) {
  const state = scenario.result.status;
  
  if (state === 'FAILED') {
    console.log(`❌ Failed`);
    if (this.lastError) {
      console.log(`   Error: ${this.lastError.message}`);
    }
  } else if (state === 'PASSED') {
    console.log(`✅ Passed`);
  } else if (state === 'PENDING') {
    console.log(`⏭️  Pending`);
  }
});

/**
 * Runs once after all scenarios complete
 */
AfterAll(function() {
  console.log('\n✨ Test suite complete\n');
});
