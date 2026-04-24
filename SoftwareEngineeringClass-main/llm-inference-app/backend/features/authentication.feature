Feature: Authentication
  As a user
  I want to register and log in
  So that I can access the dashboard

  Scenario: Successful registration with valid credentials
    Given I am a new visitor
    When I register with email "student@example.com" and password "ValidPass123!"
    Then the registration should succeed
    And the created user email should be "student@example.com"

  Scenario: Login succeeds with an existing account
    Given a registered user with email "existing@example.com" and password "ValidPass123!"
    When I log in with email "existing@example.com" and password "ValidPass123!"
    Then the login should succeed
    And the logged in user email should be "existing@example.com"
