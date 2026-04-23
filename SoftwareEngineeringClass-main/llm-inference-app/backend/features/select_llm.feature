# User Story 1 - Select Backend LLM
Feature: Select Backend LLM

  Scenario: Model selector is visible on the dashboard
    Given I am logged in and on the dashboard
    Then I should see a model selector on the page

  Scenario: User selects a model before sending a message
    Given I am logged in and on the dashboard
    When I select a model from the dropdown
    Then the selected model should be displayed
