let stripAnsi;
import("strip-ansi").then((module) => {
	stripAnsi = module.default;
});

module.exports = function setupWebSocket(app, uuidv4, clients, docker) {
	app.ws("/terminal", (ws, req) => {
		createClient(ws, uuidv4, clients, docker);

		ws.on("message", (message) => handleMessage(message, ws, clients));

		ws.on("close", () => handleClose(ws, clients, docker));
	});
};

function createClient(ws, uuidv4, clients, docker) {
	const clientId = uuidv4();

	const client = {
		ws,
		containerId: null,
		exec: null,
		steam: null,
		docker,
	};
	clients.set(clientId, client);
	ws.clientId = clientId;
	ws.send(JSON.stringify({ clientId }));
}

async function handleMessage(message, ws, clients) {
	const clientId = ws.clientId;
	const client = clients.get(clientId);
	const docker = client.docker;
	const containerId = client.containerId;

	if (typeof message === "string") {
		console.log(`Received Message: ${message}`);
		let command;
		try {
			command = JSON.parse(message).command;
		} catch (error) {
			console.error(`Failed to parse message: ${message}`);
			console.error(error);
			return;
		}

		console.log(`Received Command: ${command}`);

		if (!containerId) {
			ws.send("No container to run command");
			return;
		}

		if (command.includes("rm")) {
			ws.send("Invalid Command");
			return;
		}

		try {
			const container = docker.getContainer(client.containerId);

			if (!client.exec) {
				client.exec = await container.exec({
					Cmd: ["/bin/bash"],
					AttachStdout: true,
					AttachStderr: true,
					AttachStdin: true,
					Tty: true,
				});

				client.stream = await client.exec.start({
					hijack: true,
					stdin: true,
				});

				let buffer = "";

				client.stream.on("data", (chunk) => {
					if (ws && ws.readyState === 1) {
						let data = chunk.toString();
						buffer += data;
						if (data.endsWith("\n")) {
							let cleanData = stripAnsi(buffer);
							cleanData = cleanData.replace(/[\x00-\x1F\x7F-\x9F]/g, " ");
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

			client.stream.write(`${command}\n`);
		} catch (err) {
			console.error(err);
			ws.send(`Error: ${err.message}`);
		}
	}
}

function handleClose(ws, clients, docker) {
	const clientId = ws.clientId;
	const client = clients.get(clientId);

	if (client && client.containerId) {
		const container = docker.getContainer(client.containerId);
		container.stop().catch((err) => console.error(err));
	}
	clients.delete(clientId);
}
