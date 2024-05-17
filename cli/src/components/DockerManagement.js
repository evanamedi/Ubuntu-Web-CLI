import React, { useEffect, useState, useRef } from "react";

export default function DockerTerminal() {
	// state to store the output from the server
	const [output, setOutput] = useState("");
	// state to store the command input by the user
	const [command, setCommand] = useState("");
	// useRef to store the WebSocket instance, ensuring it persists across renders
	const ws = useRef(null);

	useEffect(() => {
		// initialize the WebSocket connection the the specified URL
		ws.current = new WebSocket("ws://localhost:5000/terminal");
		// Create a TextDecoder to handle text data received from the WebSocket
		const decoder = new TextDecoder("utf-8", { stream: true });

		// Event handler for when the WebSocket connection opens
		ws.current.onopen = () => {
			console.log("Websocket Client Connected");
		};

		// event handler for when a message is received from the WebSocket
		ws.current.onmessage = (e) => {
			// check if received data is a string
			if (typeof e.data === "string") {
				try {
					// try to parse the string data as JSON
					const message = JSON.parse(e.data);
					// check if the message contains a clientId
					if (message.clientId) {
						// store the clientId in a cookie
						document.cookie = `clientId=${message.clientId}`;
					} else {
						// append the received message to the output
						setOutput(
							(prevOutput) => prevOutput + message + "\n"
						);
					}
				} catch (error) {
					// if parsing fails, treat the data as plain text and append to the output
					setOutput((prevOutput) => prevOutput + e.data + "\n");
				}
			} else if (e.data instanceof ArrayBuffer) {
				// if the received data is an ArrayBuffer, decode it to a string
				const text = decoder.decode(e.data);
				// append the decoded text to the output
				setOutput((prevOutput) => prevOutput + text + "\n");
			} else {
				// log an error if the received data is of an unexpected type
				console.error(
					"Received data is not a string or an ArrayBuffer"
				);
			}
		};

		// event handler for WebSocket errors
		ws.current.onerror = (error) => {
			console.error("WebSocket Error:", error);
		};

		// event handler for when the WebSocket connection closes
		ws.current.onclose = () => {
			console.log("WebSocket Closed");
		};

		// cleanup function to close the WebSocket connection when the component unmounts
		return () => {
			if (ws.current) {
				ws.current.close();
			}
		};
	}, []);

	// function to fetch data from the given URL and update the output
	const fetchAndUpdateOutput = (url) => {
		fetch(url, {
			method: "GET",
			credentials: "same-origin",
		})
			.then((response) => response.text())
			.then((data) => {
				// append the fetched data to the output
				setOutput((prevOutput) => prevOutput + data + "\n");
			});
	};

	// "Start Container" handler
	const handleStartClick = () => {
		fetchAndUpdateOutput("/start");
	};

	// "Stop Container" handler
	const handleStopClick = () => {
		fetchAndUpdateOutput("/stop");
	};

	// "Restart Container" handler
	const handleRestartClick = () => {
		fetchAndUpdateOutput("/restart");
	};

	// form submission handler
	const handleSubmit = (e) => {
		e.preventDefault();
		// check if the WebSocket connection is open before sending command
		if (ws.current && ws.current.readyState === WebSocket.OPEN) {
			// send the command as a JSON string
			ws.current.send(JSON.stringify({ command: command }));
			// clear the command input field
			setCommand("");
		} else {
			// log an error if the WebSocket if not open
			console.error(
				"WebSocket is not open. Unable to send message."
			);
		}
	};

	return (
		<div className="p-4 bg-black py-20">
			<div className="mb-8">
				<div className="flex flex-row justify-center mb-16">
					<button
						onClick={handleStartClick}
						className="mr-2 px-4 py-2 bg-gray-400 text-black rounded hover:bg-blue-300 ">
						Start Container
					</button>
					<button
						onClick={handleStopClick}
						className="mr-2 px-4 py-2 bg-gray-400 text-black rounded hover:bg-red-200">
						Stop Container
					</button>
					<button
						onClick={handleRestartClick}
						className="px-4 py-2 bg-gray-400 text-black rounded hover:bg-yellow-200">
						Restart Container
					</button>
				</div>
				<div className="h-96 p-4 bg-gray-900 text-white overflow-y-auto rounded py-16 border">
					<pre>{output}</pre>
					<form
						onSubmit={handleSubmit}
						className=" bg-transparent w-full">
						<input
							type="text"
							value={command}
							onChange={(e) => setCommand(e.target.value)}
							className=" py-2 border-b rounded w-full bg-transparent focus:outline-none"
						/>
						<button type="submit" className=""></button>
					</form>
				</div>
			</div>
		</div>
	);
}
