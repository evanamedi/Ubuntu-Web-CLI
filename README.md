# Ubuntu-Web-Terminal

This repository contains an Express.js server setup with WebSocket support, user authentication, session management, and static file serving for a React application.

## Features

-   **Express Server**: Provides the foundation for handling HTTP requests.
-   **WebSocket Support**: Enables real-time communication using WebSockets.
-   **Authentication**: Integrates Passport.js for handling user authentication.
-   **Session Management**: Utilizes Express Session for managing user sessions.
-   **MongoDB Connection**: Connects to a MongoDB database using Mongoose.
-   **CORS**: Supports Cross-Origin Resource Sharing.
-   **Static File Serving**: Serves static files from a React app's build directory.
-   **Error Handling**: Middleware for logging errors and sending error responses.

## Setup and Usage

### Prerequisites

-   Node.js
-   MongoDB
-   Environment variables: `SESSION_SECRET`, `MONGO_URI`, and `PORT`.

### Installation

1. Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2. Install dependencies:
    ```bash
    npm install
    ```
3. Set up environment variables in a `.env` file:
    ```
    SESSION_SECRET=your_session_secret
    MONGO_URI=your_mongo_uri
    PORT=your_port
    ```

### Running the Server

1. Start the MongoDB server.
2. Start the Express server:
    ```bash
    npm start
    ```

The server will be running at `http://localhost:<PORT>`.

## Code Overview

-   **Server Setup**: The main server setup is in the `server.js` file.
-   **WebSocket Configuration**: WebSocket setup is handled in the `websocket.js` file.
-   **Routes and Middleware**: Routes are imported from the `routes` directory and middleware is configured for sessions, cookies, and authentication.
-   **Static Files**: The server is configured to serve static files from the React app's build directory.

### Key Files

-   `server.js`: Main server configuration.
-   `websocket.js`: WebSocket setup function.
-   `routes/`: Directory containing route definitions.
-   `middleware/auth.js`: Authentication middleware.
-   `config.js`: Configuration file for environment variables.
-   `context.js`: Context setup for shared resources like clients and Docker.

### Error Handling

The server includes error handling middleware to log errors and respond with a message.

## Contribution

Feel free to fork the repository and make pull requests. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License.
