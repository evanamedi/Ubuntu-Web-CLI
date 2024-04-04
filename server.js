// import necessary modules
const express = require("express"); // express for creating server
const { PORT } = require("./config");
const passport = require("passport");
const mongoose = require("mongoose");
const expressWs = require("express-ws"); // express-ws for WebSocket support

const cookieParser = require("cookie-parser"); // cookie-parser for parsing cookies
const { v4: uuidv4 } = require("uuid"); // uuid for generating unique client IDs
const session = require("express-session");
const setupWebSocket = require("./websocket"); // WebSocket setup function
const { clients, docker } = require("./context.js");

const auth = require("./middleware/auth");
const routes = require("./routes");
const config = require("./config");

mongoose.connect(config.MONGO_URI);

const app = express(); // create a new express application

app.use(express.json()); // JSON middleware
app.use(cookieParser()); // cookie parsing middleware
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

app.use("/secure/index", auth.ensureAuthenticated);
app.use("login", auth.ensureUnauthenticated);
app.use("register", auth.ensureUnauthenticated);

app.use(routes);
expressWs(app); // enable WebSocket support

app.use(express.static("public")); // static files in public

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
