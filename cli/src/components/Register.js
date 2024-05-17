import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";

export default function Register() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isRegistered, setIsRegistered] = useState(false);

	const handleSubmit = async (event) => {
		event.preventDefault();
		try {
			const response = await fetch("/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					username: username,
					password: password,
				}),
			});
			if (response.ok) {
				setIsRegistered(true);
			} else {
				// failed- handle error and displayed error message
			}
		} catch (error) {
			// handle network error or any other issues
		}
	};

	return (
		<div>
			<h1>Registration Page</h1>
			<form onSubmit={handleSubmit}>
				<label htmlFor="username">Username:</label>
				<br />
				<input
					type="text"
					id="username"
					name="username"
					required
					value={username}
					onChange={(e) => setUsername(e.target.value)}
				/>
				<br />
				<label htmlFor="password">Password:</label>
				<br />
				<input
					type="password"
					id="password"
					name="password"
					required
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>
				<br />
				<input type="submit" value="Register" />
			</form>
			<div>
				<Link to="/">Login</Link>
			</div>
			{isRegistered && <Navigate to="/" />}
		</div>
	);
}
