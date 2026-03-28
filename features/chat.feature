Feature: User can chat with LLM
  As a logged-in user
  I want to type a question and receive a response from an LLM
  So that I can get answers to my questions

  # ── Chat Interface ────────────────────────────────────────────────────────────
  Scenario: Chat page loads with input box and send button
    Given I am logged in and on the chat page
    Then I should see a text input box
    And I should see a "Send" button

  # ── Sending Messages ──────────────────────────────────────────────────────────
  Scenario: User sends a message by clicking the send button
    Given I am logged in and on the chat page
    When I fill in "messageInput" with "What is the capital of France?"
    And I click the "Send" button
    Then my message should appear in the chat window
    And I should see a response from the LLM below my message

  Scenario: User sends a message by pressing Enter
    Given I am logged in and on the chat page
    When I fill in "messageInput" with "What is the capital of France?"
    And I press "Enter"
    Then my message should appear in the chat window
    And I should see a response from the LLM below my message

  # ── Error Handling ────────────────────────────────────────────────────────────
  Scenario: Error message is displayed when LLM fails to respond
    Given I am logged in and on the chat page
    And the LLM service is unavailable
    When I fill in "messageInput" with "What is the capital of France?"
    And I click the "Send" button
    Then I should see an error message "Failed to get a response. Please try again."
