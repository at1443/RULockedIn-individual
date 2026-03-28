Feature: User can view conversation history
  As a logged-in user
  I want to see a list of my past conversations
  So that I can review previous answers the LLM gave me

  # ── History Access ────────────────────────────────────────────────────────────
  Scenario: User sees a history button on the chat page
    Given I am logged in and on the chat page
    Then I should see a history button

  Scenario: User opens conversation history and sees past conversations
    Given I am logged in and on the chat page
    And I have at least one past conversation
    When I click the history button
    Then I should see a list of past conversations
    And each conversation should show a preview of the first message
    And each conversation should show a timestamp

  # ── Viewing a Conversation ────────────────────────────────────────────────────
  Scenario: User clicks a past conversation and sees the full conversation
    Given I am logged in and on the chat page
    And I have at least one past conversation
    When I click the history button
    And I click on a past conversation
    Then the full conversation should be displayed in the chat window
    And all messages and LLM responses should be visible

  # ── Persistence ───────────────────────────────────────────────────────────────
  Scenario: Conversations persist after logging out and back in
    Given I have sent a message in a conversation
    When I log out
    And I log back in
    And I click the history button
    Then I should still see my past conversation in the list
