import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";

export default function Login() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const [redirect, setRedirect] = useState(false);

	const handleSubmit = async (event) => {
		event.preventDefault();

		try {
			const response = await fetch("/login", {
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
				setRedirect(true);
			} else {
				const errorMessage = await response.text();
				setErrorMessage(errorMessage);
			}
		} catch (error) {
			setErrorMessage("An error occurred. Please try again later.");
		}
	};

	return (
		<div>
			<h1 className="text-4xl">Login Page</h1>
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
				<input type="submit" value="Login" />
			</form>
			{errorMessage && (
				<div style={{ color: "red" }}>{errorMessage}</div>
			)}
			<div>
				<Link to="/register">Register</Link>
			</div>
			{redirect && <Navigate to="/terminal" />}
		</div>
	);
}
