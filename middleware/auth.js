const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const User = require("../models/user");

passport.use(
	"local",
	new LocalStrategy(async (username, password, done) => {
		try {
			const user = await User.findOne({
				username: username,
			});
			if (!user) {
				return done(null, false, {
					message: "No user with that username ",
				});
			}
			if (!bcrypt.compareSync(password, user.password)) {
				return done(null, false, {
					message: "Incorrect Password",
				});
			}
			return done(null, user);
		} catch (err) {
			return done(err);
		}
	})
);

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
	try {
		const user = await User.findById(id);
		done(null, user);
	} catch (err) {
		done(err);
	}
});

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect("/login");
}

function ensureUnauthenticated(req, res, next) {
	if (!req.isAuthenticated()) {
		return next();
	}
	res.redirect("index");
}

module.exports = {
	ensureAuthenticated,
	ensureUnauthenticated,
};
