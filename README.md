# CLI WebSocket Docker Management Application

## Overview

This project is a web-based CLI management system that allows users to start, stop, and manage Docker containers via WebSocket connections. The application is built using Node.js and Express, with MongoDB as the database for user authentication and session management. Key features include user authentication, secure communication, rate limiting, and input validation to ensure a safe and efficient environment for managing Docker containers.

![Register](/images/register.png)
![Login](/images/login.png)
![Start](/images/start.png)
![Use](/images/use.png)

## Features

-   **User Authentication:** Users can register and log in using secure password hashing with bcrypt. Authentication is handled via Passport.js using the local strategy.
-   **Docker Container Management:** Users can start, stop, restart, and execute commands in Docker containers via WebSocket connections.
-   **WebSocket Integration:** Real-time communication with Docker containers is facilitated through WebSockets, allowing for immediate feedback from container operations.
-   **Security Enhancements:** The application includes various security measures such as XSS protection, rate limiting, input validation, and secure password handling.
-   **Session Management:** User sessions are managed using `express-session` with secure cookies.
-   **Logging:** Application actions and errors are logged with timestamps for easy tracking and debugging.
-   **Error Handling:** Robust error handling mechanisms are in place to capture and manage unexpected issues.

## Technologies Used

-   **Node.js**
-   **Express.js**
-   **MongoDB**
-   **Docker**
-   **WebSocket**
-   **Passport.js**
-   **bcrypt**
-   **uuid**

## Usage

-   **Register and Login:**

    -   Visit `/register` to create a new account.
    -   Visit `/login` to log in with an existing account.

-   **Docker Container Management:**
    -   After logging in, users can start, stop, restart, and execute commands in Docker containers via the web interface.

## Security Considerations

-   **XSS Protection:** Input validation and secure handling of WebSocket messages help prevent cross-site scripting attacks.
-   **Password Security:** User passwords are hashed with bcrypt before storing in the database.
-   **Session Security:** Sessions are secured with `express-session` and encrypted cookies.

## Logging and Error Handling

-   The application includes detailed logging of actions and errors to help in debugging and monitoring the application.
-   Errors are handled gracefully, with responses sent to the client and logs recorded on the server.
