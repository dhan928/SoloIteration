# User Story 5 - Ask Weather Questions
Feature: Ask Weather Questions

  Scenario: User asks a weather question
    Given I am logged in and on the dashboard
    When I type "What is the weather in New York?" in the message input
    And I click the send button
    Then I should see a response in the chat
