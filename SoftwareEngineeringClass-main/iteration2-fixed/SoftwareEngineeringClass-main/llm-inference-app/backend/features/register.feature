Feature: Account Creation
  As a non-Rutgers user
  I want to create a new account

  Scenario: Successful account registration
    Given I am on the Create Account page
    When I enter a valid email and password
    And I click Submit
    Then my account should be created
    And I should be logged into the app
