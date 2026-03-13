Feature: User Authentication
  As a visitor to Frog Prompt
  I want to create an account and log in
  So that I can access the LLM interface

  # ── Landing Page ─────────────────────────────────────────────────────────────
  Scenario: Landing page loads with navigation links
    Given I navigate to the home page
    Then the page title should contain "Frog Prompt"
    And I should see a "Sign Up" link in the navigation
    And I should see a "Login" link in the navigation

  # ── Sign Up ───────────────────────────────────────────────────────────────────
  Scenario: Successful account creation
    Given I am on the sign up page
    When I fill in "newUserName" with "testuser"
    And I fill in "newUserEmail" with "testuser@example.com"
    And I fill in "newUserPassword1" with "password123"
    And I fill in "newUserPassword2" with "password123"
    And I click the "Sign Up" button
    Then I should be redirected to the home page

  Scenario: Sign up fails when username is empty
    Given I am on the sign up page
    When I fill in "newUserName" with ""
    And I fill in "newUserEmail" with "testuser@example.com"
    And I fill in "newUserPassword1" with "password123"
    And I fill in "newUserPassword2" with "password123"
    And I click the "Sign Up" button
    Then I should see an error message "Username cannot be empty."

  Scenario: Sign up fails when passwords do not match
    Given I am on the sign up page
    When I fill in "newUserName" with "testuser"
    And I fill in "newUserEmail" with "testuser@example.com"
    And I fill in "newUserPassword1" with "password123"
    And I fill in "newUserPassword2" with "different456"
    And I click the "Sign Up" button
    Then I should see an error message "Passwords do not match."

  Scenario: Sign up fails when password is too short
    Given I am on the sign up page
    When I fill in "newUserName" with "testuser"
    And I fill in "newUserEmail" with "testuser@example.com"
    And I fill in "newUserPassword1" with "short"
    And I fill in "newUserPassword2" with "short"
    And I click the "Sign Up" button
    Then I should see an error message "Password must be at least 8 characters."

  # ── Login ─────────────────────────────────────────────────────────────────────
  Scenario: Login page loads with email and password fields
    Given I am on the login page
    Then I should see the login form

  Scenario: Login fails with empty email
    Given I am on the login page
    When I fill in "existingUserEmail" with ""
    And I fill in "existingUserPassword" with "password123"
    And I click the "Login" button
    Then I should see an error message "Email is required."

  Scenario: Login fails with empty password
    Given I am on the login page
    When I fill in "existingUserEmail" with "someone@example.com"
    And I fill in "existingUserPassword" with ""
    And I click the "Login" button
    Then I should see an error message "Password is required."

  Scenario: Login fails with wrong credentials
    Given I am on the login page
    When I fill in "existingUserEmail" with "nobody@example.com"
    And I fill in "existingUserPassword" with "wrongpassword"
    And I click the "Login" button
    Then I should see an error message "Invalid email or password."
