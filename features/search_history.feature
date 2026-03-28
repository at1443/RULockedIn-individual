Feature: User can search conversation history
  As a logged-in user
  I want to search through my past conversations by keyword
  So that I can quickly find specific topics or answers

  # ── Search Interface ──────────────────────────────────────────────────────────
  Scenario: User sees a search bar in the conversation history area
    Given I am logged in and on the chat page
    When I click the history button
    Then I should see a search bar

  # ── Searching ─────────────────────────────────────────────────────────────────
  Scenario: User searches by keyword and sees filtered results
    Given I am logged in and on the chat page
    And I have past conversations containing the keyword "France"
    When I click the history button
    And I fill in "searchInput" with "France"
    And I press "Enter"
    Then the conversation list should only show conversations containing "France"

  Scenario: User searches by keyword and clicks the search button
    Given I am logged in and on the chat page
    And I have past conversations containing the keyword "France"
    When I click the history button
    And I fill in "searchInput" with "France"
    And I click the "Search" button
    Then the conversation list should only show conversations containing "France"

  Scenario: User clicks a search result and sees the full conversation
    Given I am logged in and on the chat page
    And I have past conversations containing the keyword "France"
    When I click the history button
    And I fill in "searchInput" with "France"
    And I press "Enter"
    And I click on a search result
    Then the full conversation should be displayed in the chat window

  # ── Edge Cases ────────────────────────────────────────────────────────────────
  Scenario: No results found for a keyword
    Given I am logged in and on the chat page
    When I click the history button
    And I fill in "searchInput" with "zzznomatchzzz"
    And I press "Enter"
    Then I should see a "No results found" message

  Scenario: Clearing the search bar restores all conversations
    Given I am logged in and on the chat page
    And I have at least one past conversation
    When I click the history button
    And I fill in "searchInput" with "France"
    And I press "Enter"
    And I clear the "searchInput" field
    Then I should see all my past conversations
