const log = require("./logging");

module.exports = {
	// define GET endpoint for starting a new Docker container
	startContainer: async function (clients, docker, req, res, next) {
		const clientId = req.cookies["clientId"]; // retrieve client ID from cookies
		log(`Starting new container for client: ${clientId}`);
		const client = clients.get(clientId); // retrieve client object from clients Map

		// check if client object doesn't exist
		if (!client) {
			log(`No client found for id: ${clientId}`, "warning");
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
			// demultiplex Docker container's output streams
			container.modem.demuxStream(
				stream,
				process.stdout,
				process.stderr
			);

			// define event handler for data from Docker container
			stream.on("data", (chunk) => {
				// check if WebSocket connection is still open
				if (client.ws && client.ws.readyState === 1) {
					client.ws.send(chunk.toString()); // if true, send data to client
				}
			});

			// send success response
			res.send("Container Started");
		} catch (err) {
			next(err); // pass any errors to next middleware
		}
	},
	//
	//
	// define GET endpoint for stopping a Docker container
	stopContainer: async function (clients, docker, req, res, next) {
		const clientId = req.cookies["clientId"]; // retrieve the client ID from cookies - yum
		const client = clients.get(clientId); // retrieve client object from clients map

		// check if client object and container ID do not exist
		if (!client || !client.containerId) {
			log("No container to stop", "warning");
			// if false, send error response
			res.status(400).send("No container to stop");
			return;
		}

		try {
			// retrieve docker container
			const container = docker.getContainer(client.containerId);
			await container.stop(); // stop docker container
			log(`Container with ID ${client.containerId} stopped`);
			res.send("Container stopped"); // send success response
		} catch (err) {
			log(`Error stopping container: ${err.message}`, "warning");
			next(err); // pass any errors to the next middleware
		}
	},
	//
	//
	// define a GET endpoint for restarting a Docker container
	restartContainer: async function (clients, docker, req, res, next) {
		const clientId = req.cookies["clientId"]; // retrieve the client ID from cookies
		const client = clients.get(clientId); // retrieve the client object form the clients Map

		// check if client objet and container ID do not exist
		if (!client || !client.containerId) {
			log("No container to restart", "warning");
			// if true, send error response
			res.status(400).send("No container to restart");
			return;
		}

		try {
			// retrieve Docker container
			const container = docker.getContainer(client.containerId);
			await container.restart(); // restart Docker container
			log(`Container with ID ${client.containerId} restarted`);
			res.send(`Container restarted`); // send success message
		} catch (err) {
			log(`Error restarting container: ${err.message}`, "warning");
			next(err); // pass any errors to the next middleware
		}
	},
	//
	//
	// define a POST endpoint for executing a command in docker container
	execCommand: async function (clients, docker, req, res, next) {
		const clientId = req.cookies["clientId"]; // retrieve the client ID from cookies
		const client = clients.get(clientId); // retrieve client object form clients Map

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
			// retrieve Docker container
			const container = docker.getContainer(client.containerId);
			// create a new exec instance in the Docker container
			const exec = await container.exec({
				Cmd: ["/bin/bash", "-c", req.body.command],
				AttachStdout: true,
				AttachStderr: true,
			});
			// start exec instance and get output stream
			const stream = await exec.start();
			// define event handlers for data and end events from output stream
			stream.on("data", (chunk) => res.write(chunk));
			stream.on("end", () => res.end());
		} catch (err) {
			next(err); // pass any errors to the next middleware
		}
	},
};
