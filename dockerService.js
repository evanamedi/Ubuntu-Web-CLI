const log = require("./utils/logging");

module.exports = {
	startContainer: async function (clients, docker, req, res, next) {
		const clientId = req.cookies["clientId"];
		log(`Starting new container for client: ${clientId}`);
		const client = clients.get(clientId);

		if (!client) {
			log(`No client found for id: ${clientId}`, "warning");

			res.status(400).send("No WebSocket connection");
			return;
		}

		try {
			const container = await docker.createContainer({
				Image: "my-image",
				Cmd: ["/bin/bash"],
				Tty: true,
				HostConfig: {
					NetworkMode: "none",
				},
				OpenStdin: true,
			});

			await container.start();
			client.containerId = container.id;

			const stream = await container.attach({
				stream: true,
				stdout: true,
				stderr: true,
				stdin: true,
			});

			container.modem.demuxStream(stream, process.stdout, process.stderr);

			stream.on("data", (chunk) => {
				if (client.ws && client.ws.readyState === 1) {
					client.ws.send(chunk.toString());
				}
			});

			res.send("Container Started");
		} catch (err) {
			next(err);
		}
	},

	stopContainer: async function (clients, docker, req, res, next) {
		const clientId = req.cookies["clientId"];
		const client = clients.get(clientId);

		if (!client || !client.containerId) {
			log("No container to stop", "warning");

			res.status(400).send("No container to stop");
			return;
		}

		try {
			const container = docker.getContainer(client.containerId);
			await container.stop();
			log(`Container with ID ${client.containerId} stopped`);
			res.send("Container stopped");
		} catch (err) {
			log(`Error stopping container: ${err.message}`, "warning");
			next(err);
		}
	},

	restartContainer: async function (clients, docker, req, res, next) {
		const clientId = req.cookies["clientId"];
		const client = clients.get(clientId);

		if (!client || !client.containerId) {
			log("No container to restart", "warning");
			res.status(400).send("No container to restart");
			return;
		}

		try {
			const container = docker.getContainer(client.containerId);
			await container.restart();
			log(`Container with ID ${client.containerId} restarted`);
			res.send(`Container restarted`);
		} catch (err) {
			log(`Error restarting container: ${err.message}`, "warning");
			next(err);
		}
	},

	execCommand: async function (clients, docker, req, res, next) {
		const clientId = req.cookies["clientId"];
		const client = clients.get(clientId);

		if (!client || !client.containerId) {
			res.status(400).send("No container to run command");
			return;
		}

		if (typeof req.body.command !== "string") {
			res.status(400).send("Invalid command");
			return;
		}

		try {
			const container = docker.getContainer(client.containerId);

			const exec = await container.exec({
				Cmd: ["/bin/bash", "-c", req.body.command],
				AttachStdout: true,
				AttachStderr: true,
			});

			const stream = await exec.start();

			stream.on("data", (chunk) => res.write(chunk));
			stream.on("end", () => res.end());
		} catch (err) {
			next(err);
		}
	},
};
