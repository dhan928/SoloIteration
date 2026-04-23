const { Given, When, Then } = require('@cucumber/cucumber');
const { isValidEmail, isValidPassword } = require('../../src/utils/validators');
const assert = require('assert');

/**
 * EMAIL VALIDATION STEPS
 */

Given('I have an email validator', function() {
  assert(typeof isValidEmail === 'function', 'Email validator should be available');
  this.emailValidator = isValidEmail;
});

When('I validate email {string}', function(email) {
  this.validationResult = this.emailValidator(email);
});

Then('the result should be {word}', function(expected) {
  const expectedBool = expected === 'true';
  assert(
    this.validationResult === expectedBool,
    `Expected ${expectedBool} but got ${this.validationResult} for email validation`
  );
});

/**
 * PASSWORD VALIDATION STEPS
 */

Given('I have a password validator', function() {
  assert(typeof isValidPassword === 'function', 'Password validator should be available');
  this.passwordValidator = isValidPassword;
});

When('I validate password {string}', function(password) {
  this.validationResult = this.passwordValidator(password);
});

Then('the validation result should be {word}', function(expected) {
  const expectedBool = expected === 'true';
  assert(
    this.validationResult === expectedBool,
    `Expected ${expectedBool} but got ${this.validationResult} for password validation`
  );
});
