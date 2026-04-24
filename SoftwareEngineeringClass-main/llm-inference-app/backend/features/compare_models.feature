Feature: Compare multiple models
  As a logged-in user
  I want to submit one prompt to multiple models
  So that I can compare answers side by side

  Scenario: Successful comparison across two models
    Given a logged-in user with id "user-1"
    When I submit a comparison prompt "Explain photosynthesis simply" to models "gpt-4,claude-v1"
    Then the comparison should succeed
    And the comparison should include 2 model results

  Scenario: Comparison fails when fewer than two models are selected
    Given a logged-in user with id "user-1"
    When I submit a comparison prompt "Explain photosynthesis simply" to models "gpt-4"
    Then the comparison should fail validation
