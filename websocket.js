// import strip-ansi module ro remove ANSI escape codes from strings
let stripAnsi;
import("strip-ansi").then((module) => {
	stripAnsi = module.default;
});

// export function to setup websocket
module.exports = function setupWebSocket(app, uuidv4, clients, docker) {
	// websocket endpoint
	app.ws("/terminal", (ws, req) => {
		createClient(ws, uuidv4, clients, docker); // new client is created once websocket connection is established
		// handle incoming messages
		ws.on("message", (message) => handleMessage(message, ws, clients));
		// handle websocket close event
		ws.on("close", () => handleClose(ws, clients, docker));
	});
};

// function to create new client
function createClient(ws, uuidv4, clients, docker) {
	const clientId = uuidv4(); // generate unique client ID
	// create new client object
	const client = {
		ws,
		containerId: null,
		exec: null,
		steam: null,
		docker,
	};
	clients.set(clientId, client); // store client object in clients Map
	ws.clientId = clientId; // store client ID in websocket object
	ws.send(JSON.stringify({ clientId })); // send client ID to client
}

// function to handle incoming messages
async function handleMessage(message, ws, clients) {
	const clientId = ws.clientId; // retrieve client ID from websocket object
	const client = clients.get(clientId); // retrieve client object from clients Map
	const docker = client.docker; // retrieve container ID from client object
	const containerId = client.containerId;

	// check if message is a string
	if (typeof message === "string") {
		console.log(`Received Message: ${message}`); // log received message
		let command;
		try {
			command = JSON.parse(message).command; // parse message to get command
		} catch (error) {
			console.error(`Failed to parse message: ${message}`); // log any errors that occur from parsing
			console.error(error);
			return;
		}

		console.log(`Received Command: ${command}`); // log received command

		// check if container exists to run command
		if (!containerId) {
			ws.send("No container to run command");
			return;
		}

		// check if command is valid
		if (command.includes("rm")) {
			ws.send("Invalid Command");
			return;
		}

		try {
			const container = docker.getContainer(client.containerId); // get the docker container

			// check if an exec instance exists
			if (!client.exec) {
				// create a new exec instance in docker container
				client.exec = await container.exec({
					Cmd: ["/bin/bash"],
					AttachStdout: true,
					AttachStderr: true,
					AttachStdin: true,
					Tty: true,
				});

				// start exec instance and get the output stream
				client.stream = await client.exec.start({
					hijack: true,
					stdin: true,
				});

				let buffer = "";
				// handle data from the output stream
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
								cleanData = parts[1].trim().split(/\s+/);
								console.log(cleanData.join(" "));
								ws.send(cleanData.join(" "));
							}
							buffer = "";
						}
					}
				});
			}

			client.stream.write(`${command}\n`); // write command to the output stream
		} catch (err) {
			console.error(err); // log any errors the occur during command execution
			ws.send(`Error: ${err.message}`);
		}
	}
}

// function to handle websocket close event
function handleClose(ws, clients, docker) {
	const clientId = ws.clientId; // retrieve the client ID from websocket object
	const client = clients.get(clientId); // retrieve the client object form the clients Map
	// check if a client and docker container exist
	if (client && client.containerId) {
		const container = docker.getContainer(client.containerId); // get the docker container
		container.stop().catch((err) => console.error(err)); // stop the docker container
	}
	clients.delete(clientId); // remove client from clients Map
}
