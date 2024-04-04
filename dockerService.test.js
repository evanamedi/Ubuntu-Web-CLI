const Docker = require("dockerode");
const httpMocks = require("node-mocks-http");
const {
	startContainer,
	stopContainer,
	restartContainer,
	execCommand,
} = require("./dockerService");

jest.mock("dockerode"); // mock docker module

// start test suit for Docker Service
describe("Docker Service", () => {
	let mockDocker;
	let mockReq;
	let mockRes;
	let mockNext;
	let clients;
	// before each test, set up necessary mock objects and variables
	beforeEach(() => {
		mockDocker = new Docker(); // create mock docker instance
		// mock createContainer method
		mockDocker.createContainer = jest.fn().mockResolvedValue({
			start: jest.fn(),
			attach: jest.fn().mockResolvedValue({
				on: jest.fn(),
			}),
			modem: {
				demuxStream: jest.fn(),
			},
			id: "mockContainerId",
		});
		// create mock request object
		mockReq = httpMocks.createRequest({
			cookies: {
				clientId: "mockClientId",
			},
		});

		mockRes = httpMocks.createResponse(); // create mock response object
		mockNext = jest.fn(); // create mock next function

		clients = new Map(); // create a map of clients
		clients.set("mockClientId", {
			containerId: "mockContainerId",
			ws: {
				readyState: 1,
				send: jest.fn(),
			},
		});
		clients.get("mockClientId").containerId = "mockContainerId";
	});
	// test startContainer function
	it("should start a container", async () => {
		await startContainer(
			clients,
			mockDocker,
			mockReq,
			mockRes,
			mockNext
		);
		// check if createContainer method was called
		expect(mockDocker.createContainer).toHaveBeenCalled();
		// check if the response data is "Container Started"
		expect(mockRes._getData()).toEqual("Container Started");
	});
	// test the stopContainer function
	it("should stop a container", async () => {
		// mock the get container method of the docker instance
		mockDocker.getContainer = jest.fn().mockReturnValue({
			stop: jest.fn().mockResolvedValue(),
		});

		await stopContainer(
			clients,
			mockDocker,
			mockReq,
			mockRes,
			mockNext
		);
		// check if the getContainer method was called with the correct argument
		expect(mockDocker.getContainer).toHaveBeenCalledWith(
			"mockContainerId"
		);
		// check if the response data is "Container stopped"
		expect(mockRes._getData()).toEqual("Container stopped");
	});
	// test the restartContainer function
	it("should restart container", async () => {
		// mock the getContainer method of the Docker instance
		mockDocker.getContainer = jest.fn().mockReturnValue({
			restart: jest.fn().mockResolvedValue(),
		});

		await restartContainer(
			clients,
			mockDocker,
			mockReq,
			mockRes,
			mockNext
		);
		// check if the getContainer method was called with the correct argument
		expect(mockDocker.getContainer).toHaveBeenCalledWith(
			"mockContainerId"
		);
		// check if the response data is "Container restarted"
		expect(mockRes._getData()).toEqual("Container restarted");
	});
	// test the execCommand function
	it("should execute commands in a container", async () => {
		// set up necessary mock objects and variables for test
		const mockReq = {
			cookies: { clientId: "mockClientId" },
			body: { command: "mockCommand" },
		};
		const mockRes = httpMocks.createResponse();
		const mockNext = jest.fn();
		const mockDocker = {
			getContainer: jest.fn().mockReturnValue({
				exec: jest.fn().mockResolvedValue({
					start: jest.fn().mockResolvedValue({
						on: jest.fn((event, callback) => {
							if (event === "data") {
								callback("Command Output");
							} else if (event === "end") {
								callback();
							}
						}),
					}),
				}),
			}),
		};
		const clients = new Map();
		clients.set("mockClientId", { containerId: "mockContainerId" });

		await execCommand(clients, mockDocker, mockReq, mockRes, mockNext);
		// check if the getContainer method was called with the correct argument
		expect(mockDocker.getContainer).toHaveBeenCalledWith(
			"mockContainerId"
		);
		// check if the response data is "Command Output"
		expect(mockRes._getData()).toEqual("Command Output");
	});
});
