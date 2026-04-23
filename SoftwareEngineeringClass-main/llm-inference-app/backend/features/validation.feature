@validation
Feature: Data Validation
  As a system administrator
  I want to ensure data is validated correctly
  So that only valid data is accepted

  @email-validation @smoke
  Scenario Outline: Email validation
    Given I have an email validator
    When I validate email "<email>"
    Then the result should be <expected>
    
    Examples:
      | email                               | expected |
      | test@example.com                   | true     |
      | user.name@subdomain.example.co.uk | true     |
      | invalid                            | false    |
      | invalid@                           | false    |
      | @example.com                       | false    |
      | test@example                       | false    |

  @password-validation @smoke
  Scenario Outline: Password validation
    Given I have a password validator
    When I validate password "<password>"
    Then the validation result should be <expected>
    
    Examples:
      | password           | expected |
      | ValidPass123!      | true     |
      | MyPassword456@     | true     |
      | weak               | false    |
      | NoNumber!          | false    |
      | NoSpecial123       | false    |
      | nouppercase123!    | false    |
