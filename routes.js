const express = require("express");
const bcrypt = require("bcrypt");
const User = require("./models/user.js");
const passport = require("passport");
const { clients, docker } = require("./context.js");

const router = express.Router();
const {
	startContainer,
	stopContainer,
	restartContainer,
	execCommand,
} = require("./dockerService");
const {
	ensureAuthenticated,
	ensureUnauthenticated,
} = require("./middleware/auth.js");

router.get("/login", ensureUnauthenticated, (req, res) => {
	res.sendFile(__dirname + "/public/login.html");
});

router.get("/register", ensureUnauthenticated, (req, res) => {
	res.sendFile(__dirname + "/public/register.html");
});

router.post("/register", async function (req, res) {
	if (!req.body.password) {
		return res.status(400).send({ error: "Password Required" });
	}
	const hashedPassword = bcrypt.hashSync(req.body.password, 10);
	const user = new User({
		username: req.body.username,
		password: hashedPassword,
	});
	try {
		await user.save();
		res.redirect("/login");
	} catch (err) {
		return res.status(500).send({ error: err });
	}
});

router.post("/login", function (req, res, next) {
	passport.authenticate("local", function (err, user, info) {
		if (err) {
			return next(err);
		}
		if (!user) {
			return res.status(401).send(info.message);
		}
		req.logIn(user, function (err) {
			if (err) {
				return next(err);
			}
			return res.send("Logged in");
		});
	})(req, res, next);
});

router.get("/index", ensureAuthenticated, (req, res) => {
	res.sendFile(__dirname + "/secure/index.html");
});

router.get("/", (req, res) => {
	res.redirect("/index");
});

// route for starting a container
router.get("/start", (req, res, next) =>
	startContainer(clients, docker, req, res, next)
);
// route for stopping a container
router.get("/stop", (req, res, next) =>
	stopContainer(clients, docker, req, res, next)
);
// route for restarting a container
router.get("/restart", (req, res, next) =>
	restartContainer(clients, docker, req, res, next)
);
// route for executing a command in container
router.post("/exec", (req, res, next) =>
	execCommand(clients, docker, req, res, next)
);

module.exports = router;
