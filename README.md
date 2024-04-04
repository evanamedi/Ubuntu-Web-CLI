# Ubuntu-Web-CLI

## server.js

this is setting up an express server with websocket support to interact with docker containers.

imported modules include express for server creation, express-ws for websocket support, dockerode for docker interaction, cookie-parser for parsing cookies, uuid for generating unique client IDs, and docker service functions

an express application and docker object are created

port number is set, and defaulting to 5000 if no environment variable is provided

Map object clients is created to store client information

websocket support is enables for the application

middleware functions are created for JSON parsing, serving static files from the public directory, and cookie parsing

routes defined for starting, stopping, restarting docker containers, and executing commands to the container. these are used in the dockerService functions

websocket server is set up

error handling middleware is defined to log errors and send error response

express server is started and listens on the specified port

the express app, uuid generation function, clients map, and docker object are exported for use in other modules

## websocket.js

this sets up a websocket server endpoint for a docker terminal

the strip-ansi module is imported asynchronously- this module is used to remove ANSI escape codes from strings

the function setupWebSocket is exported. this function takes four arguments: the express application (app), the uuid generation function (uuid4), the Map of clients (clients), and the docker object (docker)

inside the setupWebSocket function, the endpoint for /terminal is defined. when a socket connection is established, a unique client ID is generated, a new client object is created and stored in the clients map, and the client id is sent to the client

an event handler is defined for incoming socket messages. if the message is a string, it is logged and parsed as JSON to extract a command. if the message cannot be parsed, and error is logged and the function returns

if the client has a container running, the command is sent to the containers exec instance. if the command includes 'rm', an error message is sent to the client and the function returns

if the client does not have an exec instance, one is created and started, and an event handler is defined for data from the output steam. the data is cleaned, split into two parts and send to the client

if an error occurs while sending the command or creating the exec instance, the error is logged and sent to the client

if the message is not a string, it is sent to the client as binary data

an event handler is defined for the websocket close event. if the client has a docker container, the container is stopped. the client is then removed from the clients map

## dockerService.js

this exports a set of functions for interacting with docker containers

startContainer: this function starts a new docker container for a client. it retrieves the client ID from cookies, checks if the client exists, and if so, creates and starts a docker container with a specific image and configuration. it attaches to the container's output streams and sends any data from these streams to the client via the websocket connection. if successful, it sends a success response; otherwise, it passes any errors to the next middleware

stopContainer: this function stops a docker container for a client. it retrieves the client ID from cookies, checks if the client and its container exists, and if so, stops the container. if successful, it sends a success response; otherwise; it passes any errors to the next middleware

restartContainer: this function restarts a docker container for a client. it retrieves the client ID from cookies, checks if the client and its container exist, and if so, restarts the container. if successful, it sends a success response; otherwise, is passes any errors to the next middleware

execCommand: this function executes a command in a docker container for a client. it retrieves the client ID from cookies, checks if the client and its container exist, and if the command is a string. if all checks pass, it creates a new exec instance in the container with the command, starts the exec instance, and sends any data from the output stream to the client. if successful, it sends the response; otherwise, it passes any errors to the next middleware.
