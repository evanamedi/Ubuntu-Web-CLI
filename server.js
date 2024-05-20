// NEXT IMPLEMENTATION:
// https
// user schema/model
// security headers
// xss protection
// rate limiting
// input validation
// better logging and error handling
// password hashing and salt

/*
express for creating server
cors for cross-origin resource sharing
PORT from config.js
passport for authentication
mongoose for MongoDb
express-ws for WebSocket support
cookie-parser for parsing cookies
uuid for generating unique client IDs
express-session for managing sessions
Websocket setup function
import clients and docker from context.js
auth middleware
routes
config
path for working with file and directory paths
create a new express application
*/
const express = require("express");
const cors = require("cors");
const { PORT } = require("./utils/config.js");
const passport = require("passport");
const mongoose = require("mongoose");
const expressWs = require("express-ws");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
const session = require("express-session");
const setupWebSocket = require("./websocket");
const { clients, docker } = require("./utils/context.js");
const auth = require("./middleware/auth");
const routes = require("./routes");
const config = require("./utils/config.js");
const path = require("path");
const app = express();

// connect to MongoDB using MONGO_URL from config
mongoose.connect(config.MONGO_URI);

app.use(cors()); // cors middleware
app.use(express.json()); // JSON middleware
app.use(cookieParser()); // cookie parsing middleware
app.use(express.urlencoded({ extended: true })); // URL-encoding middleware

// express session middleware
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
	})
);

// initialize and use passport for session management
app.use(passport.initialize());
app.use(passport.session());

app.use(routes); // use routes
expressWs(app); // enable WebSocket support

// serve static files from the React apps's build directory
app.use(express.static(path.join(__dirname, "build")));

// handle all GET requests by sending back the React app's index.html file
app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "build", "index.html"));
});

// setup websocket with app, uuidv4, clients, docker
setupWebSocket(app, uuidv4, clients, docker);

// define error handling middleware
app.use((err, req, res, next) => {
	console.error(err.stack); // log the error stack strace
	res.status(500).send(`Error: ${err.message}`); // send error response
});

// start express server
app.listen(PORT, () =>
	console.log(`Server is running at http://localhost:${PORT}`)
);

module.exports = { app, uuidv4, clients, docker };
