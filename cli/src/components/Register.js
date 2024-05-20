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
		<div className=" flex justify-center mx-16 ">
			<div className="flex justify-center max-w-96 bg-white bg-opacity-90 rounded-lg pb-10 pt-10">
				<div>
					<h1 className="text-4xl text-center text-black">
						Registration
					</h1>
					<div className="mt-20">
						<form onSubmit={handleSubmit}>
							<div className="flex flex-row flex-wrap justify-center">
								<div className="mx-6 mt-6">
									<label
										htmlFor="username"
										className="text-black text-opacity-30 text-xs">
										Username:
									</label>
									<br />
									<input
										className=" placeholder-black placeholder-opacity-30 pl-1 pr-2 bg-white bg-opacity-0 border-b border-black py-2 text-sm focus:outline-none"
										placeholder="Enter your username"
										type="text"
										id="username"
										name="username"
										required
										value={username}
										onChange={(e) =>
											setUsername(e.target.value)
										}
									/>
									<br />
								</div>
								<div className="mx-6 mt-6">
									<label
										htmlFor="password"
										className="text-black text-opacity-30 text-xs">
										Password:
									</label>
									<br />
									<input
										className=" placeholder-black placeholder-opacity-30 pl-1 pr-2 bg-white bg-opacity-0 border-b border-black py-2 text-sm focus:outline-none"
										placeholder="Enter your password"
										type="password"
										id="password"
										name="password"
										required
										value={password}
										onChange={(e) =>
											setPassword(e.target.value)
										}
									/>
									<br />
								</div>
							</div>
							<div className="flex justify-center mt-10">
								<input
									type="submit"
									value="Register"
									className="text-white hover:underline hover:text-white hover:cursor-pointer bg-gradient-to-l from-vi to-or px-10 py-1 rounded-lg"
								/>
							</div>
						</form>
					</div>
					<div className="flex justify-center mt-36 text-black hover:underline">
						<Link to="/">Login</Link>
					</div>

					{isRegistered && <Navigate to="/" />}
				</div>
			</div>
		</div>
	);
}
