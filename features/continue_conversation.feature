Feature: User can continue a previous conversation
  As a logged-in user
  I want to select a past conversation and continue chatting in it
  So that the LLM remembers the context of what we already discussed

  # ── Loading a Past Conversation ───────────────────────────────────────────────
  Scenario: User opens a past conversation and sees all prior messages
    Given I am logged in and on the chat page
    And I have at least one past conversation
    When I click the history button
    And I click on a past conversation
    Then the full previous conversation should be loaded in the chat window
    And all prior messages and LLM responses should be visible

  # ── Continuing the Conversation ───────────────────────────────────────────────
  Scenario: User sends a new message in a past conversation
    Given I am logged in and on the chat page
    And I have opened a past conversation
    When I fill in "messageInput" with "Can you elaborate on that?"
    And I click the "Send" button
    Then my new message should be appended to the conversation
    And the LLM should respond with awareness of the prior conversation

  # ── Persistence ───────────────────────────────────────────────────────────────
  Scenario: New messages are saved to the existing conversation
    Given I am logged in and on the chat page
    And I have opened a past conversation
    When I fill in "messageInput" with "Can you elaborate on that?"
    And I click the "Send" button
    And I click the history button
    Then the conversation's preview should reflect the latest message
    And the conversation's timestamp should be updated
