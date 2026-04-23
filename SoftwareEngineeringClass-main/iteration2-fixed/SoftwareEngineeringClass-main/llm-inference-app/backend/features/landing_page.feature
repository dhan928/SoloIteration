Feature: Landing Page
  As a new visitor
  I want to see a landing page with navigation buttons

  Scenario: Visiting the landing page
    Given I am a new user who is not logged in
    When I navigate to the home URL
    Then I should see "Login" on the page
    And I should see "Create Account" on the page
