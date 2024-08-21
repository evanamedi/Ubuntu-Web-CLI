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

mongoose.connect(config.MONGO_URI);

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
	})
);

app.use(passport.initialize());
app.use(passport.session());

app.use(routes);
expressWs(app);

app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "build", "index.html"));
});

setupWebSocket(app, uuidv4, clients, docker);

app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send(`Error: ${err.message}`);
});

app.listen(PORT, () => console.log(`Server is running at http://localhost:${PORT}`));

module.exports = { app, uuidv4, clients, docker };
