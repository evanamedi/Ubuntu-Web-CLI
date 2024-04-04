const request = require("/supertest");
const { app } = require("./server");

describe("Server Routes", () => {
	it("should respond to GET /start", async () => {
		const res = await request(app).get("/start");
		expect(res.statusCode).toEqual(200);
	});

	it("should response to GET /stop", async () => {
		const res = await request(app).get("/stop");
		expect(res.statusCode).toEqual(200);
	});
});
