@comparison
Feature: Compare Multiple LLMs Simultaneously
  As a logged-in user
  I want to submit one prompt to multiple models
  So that I can compare answers side by side

  Background:
    Given the application is initialized
    And the database is accessible
    And I am logged in as a test user

  @comparison @smoke
  Scenario: Successful comparison across multiple models
    Given I am on the dashboard
    When I select "gpt-4" and "claude-v1" for comparison
    And I type "Explain photosynthesis simply" in the comparison prompt input
    And I click the Compare button
    Then I should see a response card for "gpt-4"
    And I should see a response card for "claude-v1"
    And the comparison should be saved in history
    And I should see both models in the comparison history

  @comparison
  Scenario: Comparison request fails when no model is selected
    Given I am on the dashboard
    And I am in comparison mode
    When I type "Explain photosynthesis simply" in the comparison prompt input
    And I don't select any models
    And I click the Compare button
    Then I should see a validation error "Please select at least 2 models"
    And no comparison should be created

  @comparison
  Scenario: Comparison request fails with single model selection
    Given I am on the dashboard
    And I am in comparison mode
    When I select "gpt-4" for comparison
    And I type "Explain photosynthesis simply" in the comparison prompt input
    And I click the Compare button
    Then I should see a validation error containing "2 models"
    And no comparison should be created

  @comparison
  Scenario: Partial failure still shows successful model results
    Given I am on the dashboard
    And I am in comparison mode
    When I select "gpt-4" and "local-small" for comparison
    And I type "Tell me a joke" in the comparison prompt input
    And I click the Compare button
    Then I should see a response card for "gpt-4" with status "completed"
    And I should see a response card for "local-small" with status "completed" or "failed"
    And the successful model response should be visible
    And the failed model should show an error state

  @comparison
  Scenario: Delete comparison from history
    Given I am on the dashboard
    And I have created a comparison
    And I can see the comparison in history
    When I click the delete button on the comparison
    And I confirm the deletion
    Then the comparison should be removed from history
    And a new comparison load should not include it

  @comparison
  Scenario: Reload comparison from history
    Given I am on the dashboard
    And I have created a comparison with prompt "What is machine learning?"
    And I can see the comparison in the history panel
    When I click on the comparison in the history
    Then the comparison details should be reloaded
    And I should see the same prompt "What is machine learning?"
    And I should see all the model responses again

  @comparison
  Scenario: Comparison with duplicate model selections fails
    Given I am on the dashboard
    And I am in comparison mode
    When I select "gpt-4" twice (attempt duplicate selection)
    Then the system should prevent duplicate model selection
    Or the comparison should fail with an error about duplicates

  @comparison
  Scenario: Comparison validates minimum prompt length
    Given I am on the dashboard
    And I am in comparison mode
    When I select "gpt-4" and "claude-v1" for comparison
    And I type "hi" in the comparison prompt input
    And I click the Compare button
    Then I should see a validation error about prompt length
    And no comparison should be created
