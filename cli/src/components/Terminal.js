import React from "react";
import DockerTerminal from "./DockerManagement";

export default function Terminal() {
	return (
		<div className="px-2 bg-black h-screen">
			<h1 className="text-center text-4xl">Linux Terminal</h1>
			<DockerTerminal />
		</div>
	);
}
