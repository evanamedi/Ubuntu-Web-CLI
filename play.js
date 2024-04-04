class DockerTerminal {
	constructor() {
		this.ws = new WebSocket("ws://localhost:5000/terminal");
		this.decoder = new TextDecoder("utf-8", {
			stream: true,
		});
		this.outputelement = document.getElementById("output");
		this.setupEventHandlers();
	}

	cleanOutput(output) {
		output = output.replace(/\x1b\[[0-9]*[A-Za-s]/g, "");
		output = output.replace(/\x1b\].*?\x07/g, "");
		output = output.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
		return output;
	}

	setupEventHandlers() {
		this.ws.open = () => {
			console.log("WebSocket Client Connected");
			document
				.getElementById("start")
				.addEventListener("click", () => {
					fetch("/start", {
						method: "GET",
						credentials: "same-origin",
					})
						.then((response) => response.text())
						.then((data) => {
							this.outputelement.innerHTML +=
								"<p>" + data + "</p>";
						});
				});
		};

		this.ws.onmessage = (e) => {
			if (typeof e.data === "string") {
				try {
					const message = JSON.parse(e.data);
					if (message.clientId) {
						document.cookie = `clientId = ${message.clientId}`;
					} else {
						this.outputelement.innerHTML += message + "<br>";
					}
				} catch (error) {
					this.outputelement.innerHTML += e.data + "<br>";
				}
			} else if (e.data instanceof ArrayBuffer) {
				const text = this.decoder.decode(e.data);
				const cleanText = this.cleanOutput(text);
				this.outputelement.innerHTML += cleanText + "<br>";
			} else {
				console.error(
					"Received data is not a string or an ArrayBuffer"
				);
			}
		};

		document.getElementById("stop").addEventListener("click", () => {
			fetch("/stop", {
				method: "GET",
				credentials: "same-origin",
			})
				.then((response) => response.text())
				.then((data) => {
					this.outputelement.innerHTML += "<p>" + data + "</p>";
				});
		});

		document
			.getElementById("restart")
			.addEventListener("click", () => {
				fetch("/restart", {
					method: "GET",
					credentials: "same-origin",
				})
					.then((response) => response.text())
					.then((data) => {
						this.outputelement.innerHTML +=
							"<p>" + data + "</p>";
					});
			});

		document
			.getElementById("exec-form")
			.addEventListener("submit", (e) => {
				e.preventDefault();
				const command = document.getElementById("command").value;
				this.ws.send(JSON.stringify({ command: command }));
				document.getElementById("command").value = "";
			});
	}
}

const DockerTerminal = new DockerTerminal();
