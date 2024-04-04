const Docker = require("dockerode"); // Dockerode for interacting with Docker

const docker = new Docker({ socketPath: "/var/run/docker.sock" }); // create a new docker object
let clients = new Map(); // create map to store client info

module.exports = { clients, docker };
