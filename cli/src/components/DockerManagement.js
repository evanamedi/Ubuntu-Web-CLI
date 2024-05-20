import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";

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
		setOutput(
			(prevOutput) =>
				prevOutput + "user@linux-desktop:-$ " + command + "\n"
		);
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
		<div className="p-4 bg-gradient-to-r from-vi to-or h-full">
			<div className="flex justify-end -mt-16 mb-16 text-black hover:underline">
				<Link to="/">Logout</Link>
			</div>
			<div className="flex flex-row justify-center mb-16">
				<button
					onClick={handleStartClick}
					className="mr-2 px-4 py-2 bg-white text-black rounded hover:bg-blue-300 ">
					Start Container
				</button>
				<button
					onClick={handleStopClick}
					className="mr-2 px-4 py-2 bg-white text-black rounded hover:bg-red-200">
					Stop Container
				</button>
				<button
					onClick={handleRestartClick}
					className="px-4 py-2 bg-white text-black rounded hover:bg-yellow-200">
					Restart Container
				</button>
			</div>
			<div className="mb-8">
				<div className="h-14 bg-gradient-to-t from-grayy to-grayylight relative top-14 rounded-t-lg ">
					<p className="text-white text-center">
						user@linux-desktop:-$
					</p>
					<div className="flex flex-row pl-2">
						<p className="text-white px-2">File</p>
						<p className="text-white px-2">Edit</p>
						<p className="text-white px-2">View</p>
						<p className="text-white px-2">Search</p>
						<p className="text-white px-2">Terminal</p>
						<p className="text-white px-2">Help</p>
					</div>
				</div>

				<div className="h-96 p-4 bg-gradient-to-r from-ubun to-ubun text-white overflow-y-auto rounded-lg py-16 ">
					<pre>{output}</pre>
					<form
						onSubmit={handleSubmit}
						className=" bg-transparent w-full">
						<input
							type="text"
							value={command}
							onChange={(e) => setCommand(e.target.value)}
							className=" py-2  rounded w-full bg-transparent focus:outline-none"
						/>
						<button type="submit" className=""></button>
					</form>
				</div>
			</div>
		</div>
	);
}
