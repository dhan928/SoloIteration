/**
 * Cucumber.js Configuration
 * Defines how Cucumber runs feature tests
 */

module.exports = {
  default: {
    // Path to step definitions
    require: [
      'features/support/**/*.js',
      'features/step_definitions/**/*.js'
    ],
    // Output formats
    format: [
      'progress-bar',
      'json:reports/cucumber-report.json'
    ],
    // Parallel execution
    parallel: 2,
    // Fail on pending steps
    strict: true,
    // Timeout per step (milliseconds)
    timeout: 30000
  },
  
  // Profile for smoke tests
  smoke: {
    require: [
      'features/support/**/*.js',
      'features/step_definitions/**/*.js'
    ],
    format: ['progress-bar'],
    tags: '@smoke',
    timeout: 20000
  }
};
