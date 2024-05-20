const setupWebSocket = require("../websocket");

describe("WebSocket Setup", () => {
	const app = {};
	const uuidv4 = jest.fn();
	const clients = new Map();
	const docker = {};

	it("should set up WebSocket server", () => {
		setupWebSocket(app, uuidv4, clients, docker);
	});
});
