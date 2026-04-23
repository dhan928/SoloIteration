# User Story 2 - Use Local Small Model
Feature: Use Local Small Model

  Scenario: Local model option is available
    Given I am logged in and on the dashboard
    Then I should see a local model option in the selector

  Scenario: User sends a prompt to a local model
    Given I am logged in and on the dashboard
    When I select a local model
    And I type "Hello" in the message input
    And I click the send button
    Then I should see a response in the chat
