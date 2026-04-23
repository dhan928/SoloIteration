@authentication
Feature: User Authentication
  As a new user
  I want to create an account and authenticate
  So that I can access the LLM inference application

  Background:
    Given the application is initialized
    And the database is accessible

  @registration @smoke
  Scenario: Successful user registration
    Given I don't have an existing account
    When I register with email "testuser@example.com" and password "ValidPass123!"
    Then my account should be created successfully
    And I should receive a user ID
    And I should be able to login with those credentials

  @registration
  Scenario: Registration fails with duplicate email
    Given a user with email "existing@example.com" already exists
    When I attempt to register with email "existing@example.com" and password "ValidPass123!"
    Then the registration should fail
    And I should receive error status 409
    And the error message should contain "already exists"

  @registration
  Scenario: Registration fails with weak password
    Given I don't have an existing account
    When I attempt to register with email "newuser@example.com" and password "weak"
    Then the registration should fail
    And I should receive error status 400
    And the error message should contain "password"

  @login @smoke
  Scenario: User login with valid credentials
    Given a user with email "testuser@example.com" and password "ValidPass123!" exists
    When I login with email "testuser@example.com" and password "ValidPass123!"
    Then I should receive an access token
    And the token should contain my user information
    And the login should succeed

  @login
  Scenario: Login fails with wrong password
    Given a user with email "testuser@example.com" and password "ValidPass123!" exists
    When I login with email "testuser@example.com" and password "WrongPassword123!"
    Then the login should fail
    And I should receive error status 401
    And the error message should contain "Invalid credentials"

  @token @smoke
  Scenario: Protected endpoint requires valid token
    Given I am not authenticated
    When I attempt to access a protected endpoint
    Then I should receive error status 401
    And the error message should contain "authentication"

  @token
  Scenario: Protected endpoint accepts valid token
    Given a user with email "testuser@example.com" and password "ValidPass123!" exists
    And I am logged in as "testuser@example.com"
    When I access a protected endpoint
    Then the request should be successful
    And I should receive data
