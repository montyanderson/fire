const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const RedisStore = require("connect-redis")(session);
const bcrypt = require("bcrypt");
const db = require("./lib/db");

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use(express.static(__dirname + "/static"));

app.use(bodyParser.urlencoded());

app.use(session({
	store: new RedisStore({ client: db }),
	secret: "keyboard cat"
}));



app.post("/", (req, res, next) => {
	Promise.resolve().then(() => {
		const { username, password } = req.body;

		if(!username || !password) {
			throw new Error("Please specify a username and password!");
		}

		if(!username.match(/^[a-z0-9]+$/i)) {
			throw new Error("Username must be alphanumeric!");
		}

		if(req.body.signup) {
			return db.existsAsync("user:" + req.body.username)
			.then(exists => {
				if(exists) {
					throw new Error("User already exists!");
				}

				return bcrypt.hash(password, 9);
			})
			.then(password => {
				const userObj = { username, password }; /* password is now hashed */

				return db.setAsync("user:" + req.body.username, JSON.stringify(userObj));
			})
			.then(() => {
				req.session.username = username;
			})
		} else if(req.body.login) {
			return db.getAsync("user:" + req.body.username)
			.then(JSON.parse)
			.then(user => {
				return bcrypt.compare(password, user.password)
				.then(auth => {
					if(!auth) {
						throw new Error("Failed to login!");
					}

					req.session.username = username;
				});
			})
		}
	})
	.then(() => {
		res.redirect("/dash");
	})
	.catch(error => {
		res.locals.formError = error.toString();
		next();
	});
});

app.all("/", (req, res) => {
	if(req.session.username) {
		return res.redirect("/dash");
	}

	res.render("index");
});

app.get("/dash", (req, res) => {
	if(!req.session.username) return;

	db.keysAsync("user:*")
	.then(users => {
		res.locals.users = users.map(u => u.replace("user:", "")).sort();
	})
	.then(() => res.render("dash"));
});

app.get("/chat/:peer", (req, res) => {
	if(!req.session.username) return;

	res.locals.peer = req.params.peer;
	res.render("chat");
});

app.get("/log/:peer", (req, res) => {
	if(!req.session.username) return;

	const key = "chat:" + [
		req.session.username,
		req.params.peer
	].sort().join(":");

	db.lrangeAsync(key, 0, -1)
	.then(messages => {
		res.end(JSON.stringify(messages.reverse().map(JSON.parse)));
	});
});

app.post("/send/:peer", (req, res) => {
	if(!req.session.username) return;

	const key = "chat:" + [
		req.session.username,
		req.params.peer
	].sort().join(":");

	const value = JSON.stringify({
		username: req.session.username,
		text: req.body.message
	});

	console.log(key, value);

	db.lpushAsync(key, value)
	.then(() => {
		res.end();
	});
});

app.listen(8000);
