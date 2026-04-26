Feature: Character counter on chat input
  As a user
  I want to see how many characters I have typed
  So that I know when I am approaching the limit

  Scenario: Counter shows zero when page loads
    Given I am logged in and on the chat page
    Then I should see a character counter showing "0 / 500 characters"

  Scenario: Counter updates as user types
    Given I am logged in and on the chat page
    When I fill in "chatInput" with "hello"
    Then I should see a character counter showing "5 / 500 characters"
