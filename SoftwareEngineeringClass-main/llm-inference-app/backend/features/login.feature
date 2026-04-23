Feature: Login
  As a Rutgers student
  I want to log in using my credentials

  Scenario: Logging in with email and password
    Given I am on the Login page
    When I enter a valid email and password
    And I click the Login button
    Then I should be redirected to my dashboard
