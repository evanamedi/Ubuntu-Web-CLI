import "./index.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Terminal from "./components/Terminal";
import Login from "./components/Login";
import Register from "./components/Register";

function App() {
	return (
		<Router>
			<div className="bg-gradient-to-r from-vi to-or py-20 h-screen">
				<header></header>
				<div>
					<Routes>
						<Route path="/" element={<Login />} />
						<Route path="/terminal" element={<Terminal />} />
						<Route path="/register" element={<Register />} />
					</Routes>
				</div>
			</div>
		</Router>
	);
}

export default App;
