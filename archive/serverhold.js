// import necessary modules
const express = require("express"); // express for creating server
const passport = require("passport");
require("dotenv").config();
const mongoose = require("mongoose");
const expressWs = require("express-ws"); // express-ws for WebSocket support
const Docker = require("dockerode"); // Dockerode for interacting with Docker
const cookieParser = require("cookie-parser"); // cookie-parser for parsing cookies
const { v4: uuidv4 } = require("uuid"); // uuid for generating unique client IDs
const session = require("express-session");
const setupWebSocket = require("../websocket"); // WebSocket setup function
const {
	startContainer,
	stopContainer,
	restartContainer,
	execCommand,
} = require("../dockerService"); // Docker service functions

mongoose.connect("mongodb://localhost/cli_db");

const bcrypt = require("bcrypt");
const userSchema = new mongoose.Schema({
	username: String,
	password: String,
});

userSchema.methods.isValidPassword = function (password) {
	return bcrypt.compareSync(password, this.password);
};

const User = mongoose.model("User", userSchema);

const LocalStrategy = require("passport-local").Strategy;
const app = express(); // create a new express application
const docker = new Docker({ socketPath: "/var/run/docker.sock" }); // create a new docker object
const port = process.env.PORT || 5000; // port #
let clients = new Map(); // create map to store client info

expressWs(app); // enable WebSocket support

app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
	})
);

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json()); // JSON middleware
app.use(cookieParser()); // cookie parsing middleware
app.use(express.urlencoded({ extended: true }));

passport.use(
	new LocalStrategy(async function (username, password, done) {
		try {
			const user = await User.findOne({ username: username });
			if (!user) {
				return done(null, false, {
					message: "Now user with that username",
				});
			}
			if (!bcrypt.compareSync(password, user.password)) {
				return done(null, false, {
					message: "Password incorrect",
				});
			}
			return done(null, user);
		} catch (err) {
			return done(err);
		}
	})
);

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
	try {
		const user = await User.findById(id);
		done(null, user);
	} catch (err) {
		done(err);
	}
});

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	} else {
		res.redirect("/login");
	}
}

function ensureUnauthenticated(req, res, next) {
	if (!req.isAuthenticated()) {
		return next();
	} else {
		res.redirect("/index");
	}
}

app.get("/login", ensureUnauthenticated, (req, res) => {
	res.sendFile(__dirname + "/public/login.html");
});

app.get("/register", ensureUnauthenticated, (req, res) => {
	res.sendFile(__dirname + "/public/register.html");
});

app.post("/register", async function (req, res) {
	if (!req.body.password) {
		return res.status(400).send({ error: "Password Required" });
	}
	const hashedPassword = bcrypt.hashSync(req.body.password, 10);
	const user = new User({
		username: req.body.username,
		password: hashedPassword,
	});
	try {
		await user.save();
		res.redirect("/login");
	} catch (err) {
		return res.status(500).send({ error: err });
	}
});

app.post("/login", function (req, res, next) {
	passport.authenticate("local", function (err, user, info) {
		if (err) {
			return next(err);
		}
		if (!user) {
			return res.status(401).send(info.message);
		}
		req.logIn(user, function (err) {
			if (err) {
				return next(err);
			}
			return res.send("Logged in");
		});
	})(req, res, next);
});

app.get("/index", ensureAuthenticated, (req, res) => {
	res.sendFile(__dirname + "/secure/index.html");
});

app.get("/", (req, res) => {
	res.redirect("/index");
});

app.use(express.static("public")); // static files in public

// route for starting a container
app.get("/start", (req, res, next) =>
	startContainer(clients, docker, req, res, next)
);
// route for stopping a container
app.get("/stop", (req, res, next) =>
	stopContainer(clients, docker, req, res, next)
);
// route for restarting a container
app.get("/restart", (req, res, next) =>
	restartContainer(clients, docker, req, res, next)
);
// route for executing a command in container
app.post("/exec", (req, res, next) =>
	execCommand(clients, docker, req, res, next)
);

// to set up WebSocket server
setupWebSocket(app, uuidv4, clients, docker);

// define error handling middleware
app.use((err, req, res, next) => {
	console.error(err.stack); // log the error stack strace
	res.status(500).send(`Error: ${err.message}`); // send error response
});

// start express server
app.listen(port, () =>
	console.log(`Server is running at http://localhost:${port}`)
);

module.exports = { app, uuidv4, clients, docker };

module.exports = function setupWebSocket(app, uuidv4, clients, docker) {
	// define websocket endpoint
	app.ws("/terminal", (ws, req) => {
		const clientId = uuidv4(); // generate unique client ID
		const client = { ws, containerId: null, exec: null, stream: null }; // create a new client object
		clients.set(clientId, client); // store client object in the clients Map
		ws.clientId = clientId; // store client ID i the websocket object
		ws.send(JSON.stringify({ clientId })); // send client ID to client

		// define event handler for incoming messages
		ws.on("message", async (message) => {
			// retrieve client object
			const clientId = ws.clientId;
			const client = clients.get(clientId);
			const containerId = client.containerId;

			// check if message is a string
			if (typeof message === "string") {
				console.log(`Received message: ${message}`); // log received message
				let command;
				try {
					// try to parse message as JSON
					command = JSON.parse(message).command;
				} catch (error) {
					// log any errors that occur during parsing
					console.error(`Failed to parse message: ${message}`);
					console.error(error);
					return;
				}
				console.log(`Recived command: ${command}`); // log received command
				// check if container ID exists
				if (!containerId) {
					ws.send("No container to run command"); // if true, send error to client
					return;
				}
				// check if command includes 'rm'
				if (command.includes("rm")) {
					ws.send("Invalid command"); // if true, send error to client
					return;
				}

				try {
					const container = docker.getContainer(
						client.containerId
					); // retrieve Docket container
					// check if exec instance exists
					if (!client.exec) {
						// if true, create a new exec instance
						client.exec = await container.exec({
							Cmd: ["/bin/bash"],
							AttachStdout: true,
							AttachStderr: true,
							AttachStdin: true,
							Tty: true,
						});
						// start the exec instance and get the output stream
						client.stream = await client.exec.start({
							hijack: true,
							stdin: true,
						});
						// define an event handler for data from output stream
						let buffer = "";
						client.stream.on("data", (chunk) => {
							if (ws && ws.readyState === 1) {
								let data = chunk.toString();
								buffer += data;
								if (data.endsWith("\n")) {
									let cleanData = stripAnsi(buffer);
									cleanData = cleanData.replace(
										/[\x00-\x1F\x7F-\x9F]/g,
										" "
									);
									let parts = cleanData.split(command);
									if (parts.length > 1) {
										cleanData = parts[1]
											.trim()
											.split(/\s+/);
										console.log(cleanData.join(" "));
										ws.send(cleanData.join(" "));
									}
									buffer = "";
								}
							}
						});
					}

					// send command to exec instance
					client.stream.write(`${command}\n`);
				} catch (err) {
					console.error(err); // log errors that occur
					ws.send(`Error: ${err.message}`); // send error to client
				}
			} else {
				// if message is not a string, send it to client as binary- not my problem
				ws.send(message);
			}
		});
		// define an event handler for close event
		ws.on("close", () => {
			const client = clients.get(clientId);
			if (client && client.containerId) {
				const container = docker.getContainer(client.containerId);
				container.stop().catch((err) => console.error(err));
			}
			clients.delete(clientId);
		});
	});
};
