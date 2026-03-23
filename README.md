# RULockedIn
My team and I are Building a web interface for agentic systems. Developing the server and client-side (focusing on the server!) preferably using only JavaScript, HTML, CSS, and Python.

Key functions for Iteration 1:

Feature: User can create an account
User Story: As a new user, I want to create an account so the platform remembers me and my requests
Acceptance Criteria: New user clicks create account, prompted to enter necessary information, user now can see the create account button

Feature: User creates account
User Story: As a new user, I filled out my necessary information so I want to create an account.
Acceptance Criteria: New user filled out neccesary information on create account screen, the user clicks create account and now has an account and can access the AI bot

Feature: User can create and account
User Story: As a new user, I want to create an account so the platform remembers me and my requests
Acceptance Criteria: New user clicks create account, prompted to enter necessary information, user now has an account and can access the AI bot

Feature: User can sign up with Rutgers CAS
User Story: As a new user who is also a student attending Rutgers University, I want to sign up with Rutgers CAS so the signup process is faster and linked with my Rutgers student account
Acceptance Criteria: New user who is a student clicks login with Rutgers CAS, they are directed to login with their Rutgers account and then successfully signed up and can access the AI Bot

Feature: User can login with Rutgers CAS
User Story: As an existing user, I want to login with Rutgers CAS so that my login is faster and smooth
Acceptance Criteria: An existing user clicks login with Rutgers CAS and are directed to login with their Rutgers account and can access their existing account

Feature: User can login
User Story: As an existing user, I want to login so that I can chat with the AI bot
Acceptance Criteria: An existing user types their username and password, clicks login, and are able to acess their existing account

Feature: User can join as a guest
User Sotry: As a new user who does not need an existing account, I want to join as a guest so that I can quickly chat with the bot 
Acceptance Criteria: A new user clicks join as guest and are able to access the AI Bot



Key functions for Iteration 2:

Feature: User can chat with LLM

User Story: As a logged-in user, I want to type a question and receive a response from an LLM so that I can get answers to my questions.

Acceptance Criteria: The logged-in user is redirected to the chat page where they see a text input box and a send button. The user types their question into the text input box and clicks the send button or presses Enter. The user's message appears in the chat window. The LLM processes the message and returns a response which is displayed below the user's message in the chat window. If the LLM fails to respond, an error message is displayed to the user.

Feature: User can view conversation history

User Story: As a logged-in user, I want to see a list of my past conversations so that I can review previous answers the LLM gave me.

Acceptance Criteria: The logged-in user sees a sidebar or history button on the chat page. The user clicks on the history button and sees a list of all their past conversations with a preview of the first message and a timestamp. The user clicks on a past conversation and the full conversation with all messages and LLM responses is displayed in the chat window. Conversations are saved automatically when the user sends messages and persist between login sessions.

Feature: User can search conversation history

User Story: As a logged-in user, I want to search through my past conversations by keyword so that I can quickly find specific topics or answers.

Acceptance Criteria: The user sees a search bar on the conversation history area. The user types a keyword into the search bar and presses Enter or clicks the search button. The conversation list filters to show only conversations that contain the keyword. The user can click on a search result to view the full conversation. If no results are found a "No results found" message is displayed. Clearing the search bar shows all conversations again.

Feature: User can continue a previous conversation

User Story: As a logged-in user, I want to select a past conversation and continue chatting in it so that the LLM remembers the context of what we already discussed.

Acceptance Criteria: The user opens a past conversation from the conversation history list. The full previous conversation is loaded in the chat window showing all prior messages. The user types a new message and clicks send. The LLM receives the previous conversation context along with the new message and responds with awareness of the prior conversation. The new messages are appended and saved to that same conversation. The conversation's timestamp and preview updates in the history list.
