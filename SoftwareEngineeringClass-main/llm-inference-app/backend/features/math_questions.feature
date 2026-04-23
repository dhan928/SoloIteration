# User Story 4 - Ask Math Questions
Feature: Ask Math Questions

  Scenario: User asks a math question
    Given I am logged in and on the dashboard
    When I type "What is 2 + 2?" in the message input
    And I click the send button
    Then I should see a response in the chat
