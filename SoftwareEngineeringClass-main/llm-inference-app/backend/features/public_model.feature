# User Story 3 - Use Public Hosted Model (GPT, Gemini, Claude)
Feature: Use Public Hosted Model

  Scenario: Public model options are visible
    Given I am logged in and on the dashboard
    Then I should see a public model option in the selector

  Scenario: User sends a prompt to a public model
    Given I am logged in and on the dashboard
    When I select a public model
    And I type "Hello" in the message input
    And I click the send button
    Then I should see a response in the chat
