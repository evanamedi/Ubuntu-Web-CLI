// import necessary modules
const express = require("express");
const expressWs = require("express-ws");
const Docker = require("dockerode");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
// create a new docker object
const docker = new Docker({ socketPath: "/var/run/docker.sock" });
const app = express(); // create a new express application
// enable WebSocket support
expressWs(app);
// create map to store client info
let clients = new Map();
// port #
const port = process.env.PORT || 5000;

app.use(express.json()); // JSON middleware
app.use(express.static("public")); // static files in public
app.use(cookieParser()); // cookie parsing middleware
// define WebSocket endpoint
app.ws("/terminal", (ws, req) => {
	const clientId = uuidv4(); // generate unique client ID
	const client = { ws, containerId: null, exec: null, stream: null }; // create new client object
	clients.set(clientId, client); // store client object in the clients Map
	ws.clientId = clientId; // store the client ID in the WebSocket object
	ws.send(JSON.stringify({ clientId })); // send client ID to client
	// define event handler for incoming messages
	ws.on("message", async (message) => {
		// retrieve the client objet
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
			console.log(`Received command: ${command}`); // log received command
			// check if container ID exists
			if (!containerId) {
				ws.send("No container to run command"); // if true, send error to client
				return;
			}
			// check if command includes "rm"
			if (command.includes("rm")) {
				ws.send("Invalid command"); // if true, send error to client
				return;
			}

			try {
				const container = docker.getContainer(client.containerId); // retrieve Docker container
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
					client.stream.on("data", (chunk) => {
						// check if WebSocket connection is still open
						if (ws && ws.readyState === 1) {
							ws.send(chunk.toString()); // if true, send data to client
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
			// if message is not a string. send it to client as binary- not my problem
			ws.send(message);
		}
	});
	// define an event handler for close event
	ws.on("close", () => {
		clients.delete(clientId); // remove the client from clients map
	});
});
//
//
//
//
//
// define GET endpoint for starting new Docker container
app.get("/start", async (req, res, next) => {
	const clientId = req.cookies["clientId"]; // retrieve client ID from cookies
	console.log(`Starting new container for client: ${clientId}`);
	const client = clients.get(clientId); // retrieve client object from clients Map
	// check if client object exists
	if (!client) {
		console.log(`No client found for id: ${clientId}`);
		// if true, send error message
		res.status(400).send("No WebSocket connection");
		return;
	}

	try {
		// create a new Docker container
		const container = await docker.createContainer({
			Image: "my-image",
			Cmd: ["/bin/bash"],
			Tty: true,
			HostConfig: {
				NetworkMode: "none",
			},
			OpenStdin: true,
		});
		// start Docker container
		await container.start();
		// store the container ID in the client object
		client.containerId = container.id;
		// attach to Docker container
		const stream = await container.attach({
			stream: true,
			stdout: true,
			stderr: true,
			stdin: true,
		});
		// dumeltiplex Docker container's output steams
		container.modem.demuxStream(
			stream,
			process.stdout,
			process.stderr
		);
		// define event handler for data from Docker container
		stream.on("data", (chunk) => {
			// check f WebSocket connection is still open
			if (client.ws && client.ws.readyState === 1) {
				client.ws.send(chunk.toString()); // if true, send data to client
			}
		});
		// send success response
		res.send("Container started");
	} catch (err) {
		next(err); // pass any errors to next middleware
	}
});
//
//
//
//
//
// define GET endpoint for stopping a Docker container
app.get("/stop", async (req, res, next) => {
	const clientId = req.cookies["clientId"]; // retrieve the client ID from cookies - yum
	const client = clients.get(clientId); // retrieve client object from clients map
	// check if client object and container ID exist
	if (!client || !client.containerId) {
		console.log("No container to stop");
		// if false, send error response
		res.status(400).send("No container to stop");
		return;
	}

	try {
		// retrieve docker container
		const container = docker.getContainer(client.containerId);
		await container.stop(); // stop docker container
		console.log(`Container with ID ${client.containerId} stopped`);
		res.send("Container stopped"); // send success response
	} catch (err) {
		console.log(`Error stopping container: ${err.message}`);
		next(err); // pass any errors to the next middleware
	}
});
// define a GET endpoint for restarting a Docker container
app.get("/restart", async (req, res, next) => {
	const clientId = req.cookies["clientId"]; // retrieve the client ID from cookies
	const client = clients.get(clientId); // retrieve the client object from the clients Map
	// check if client object and container ID exist
	if (!client || !client.containerId) {
		console.log("No container to restart");
		// if false, send error response
		res.status(400).send("No container to restart");
		return;
	}

	try {
		// retrieve Docker container
		const container = docker.getContainer(client.containerId);
		await container.restart(); // restart Docker container
		console.log(`Container with ID ${client.containerId} restarted`);
		res.send("Container restarted"); // send success message
	} catch (err) {
		console.log(`Error restarting container: ${err.message}`);
		next(err); // pass any errors to the next middleware
	}
});
//
//
//
//
//
// define a POST endpoint for executing a command in Docker container
app.post("/exec", async (req, res, next) => {
	const clientId = req.cookies["clientId"]; // retrieve the client ID from cookies
	const client = clients.get(clientId); // retrieve client object from clients Map
	// check if the client object and container ID do not exist
	if (!client || !client.containerId) {
		// if true, send error response
		res.status(400).send("No container to run command");
		return;
	}
	// check if command is not a string
	if (typeof req.body.command !== "string") {
		res.status(400).send("Invalid command"); // if true, send an error message
		return;
	}

	try {
		// retrieve docker container
		const container = docker.getContainer(client.containerId);
		// create a new exec instance in the Docker container
		const exec = await container.exec({
			Cmd: ["/bin/bash", "-c", req.body.command],
			AttachStdout: true,
			AttachStderr: true,
		});
		// start exec instance and get output stream
		const stream = await exec.start();
		// define event handlers for data and end events from the output stream
		stream.on("data", (chunk) => res.write(chunk));
		stream.on("end", () => res.send());
	} catch (err) {
		next(err); // pass any errors to the next middleware
	}
});
// define error handling middleware
app.use((err, req, res, next) => {
	console.error(err.stack); // log the error stack strace
	res.status(500).send(`Error: ${err.message}`); // send error response
});
// start express server
app.listen(port, () =>
	console.log(`Server is running at http://localhost:${port}`)
);
