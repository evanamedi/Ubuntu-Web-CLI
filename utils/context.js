const Docker = require("dockerode");

const docker = new Docker({ socketPath: "/var/run/docker.sock" });
let clients = new Map();

module.exports = { clients, docker };
