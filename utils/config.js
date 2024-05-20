require("dotenv").config();

module.exports = {
	MONGO_URI: "mongodb://localhost/cli_db",
	PORT: process.env.PORT || 5000,
	SESSION_SECRET: process.env.SESSION_SECRET,
};
