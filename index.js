const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const RedisStore = require("connect-redis")(session);
const bcrypt = require("bcrypt");
const NodeRSA = require("node-rsa");
const db = require("./lib/db");
const Post = require("./lib/Post");

const serverKey = require("./lib/serverKey");
const publicKey = serverKey.exportKey("pkcs8-public-pem");

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use(express.static(__dirname + "/static"));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
	store: new RedisStore({ client: db }),
	secret: "keyboard cat",
	saveUninitialized: false,
	resave: true
}));

app.use((req, res, next) => {
	req.session = req.session || {};
	res.locals.publicKey = publicKey;

	next();
});

/* hack to add pre existing users to new users set */



app.post("/", (req, res, next) => {
	Promise.resolve().then(() => {
		let { username, password } = req.body;

		username = username.trim().toLowerCase();

		if(!username || !password) {
			throw new Error("Please specify a username and password!");
		}

		if(!username.match(/^[a-z0-9]+$/i)) {
			throw new Error("Username must be alphanumeric!");
		}

		if(username.length < 2) {
			throw new Error("Username must be 2 characters or more!");
		}

		if(username.length > 12) {
			throw new Error("Username must be 12 characters or less!");
		}

		if(password.length < 5) {
			throw new Error("Password must be 5 characters or more!");
		}

		if(password.length > 20) {
			throw new Error("Password must be 20 characters or less!");
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

				return db.setAsync("user:" + username, JSON.stringify(userObj));
			})
			.then(() => {
				return db.saddAsync("fire:users", username);
			})
			.then(() => {
				req.session.username = username;
			});
		} else if(req.body.login) {
			return db.getAsync("user:" + username)
			.then(JSON.parse)
			.then(user => {
				return bcrypt.compare(password, user.password)
				.then(auth => {
					if(!auth) {
						throw new Error("Failed to login!");
					}

					req.session.username = username;
				})
			});
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

app.post("/log/:peer", (req, res) => {
	if(!req.session.username) return;

	const key = "chat:" + [
		req.session.username,
		req.params.peer
	].sort().join(":");

	db.lrangeAsync(key, 0, 20)
	.then(messages => {
		const data = JSON.stringify(messages.reverse().map(JSON.parse));
		const clientKey = new NodeRSA(req.body.publicKey);
		res.end(clientKey.encrypt(data, "base64"));
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
		text: serverKey.decrypt(req.body.message, "utf8")
	});

	db.lpushAsync(key, value)
	.then(() => {
		res.end();
	});
});

app.post("/api/feed", (req, res) => {
	const clientKey = new NodeRSA(req.body.publicKey);

	Post.feed().then(feed => {
		res.end(clientKey.encrypt(JSON.stringify(feed), "base64"));
	});
});

app.post("/api/react", (req, res) => {
	const clientKey = new NodeRSA(req.body.publicKey);
	console.log(req.body);
	const react = serverKey.decrypt(req.body.react, "utf8");
	const post = serverKey.decrypt(req.body.post, "utf8");

	Post.react(post, req.session.username, +react)
		.then(a => res.end())
		.catch(a => res.end());
});

app.post("/api/post", (req, res) => {
	const clientKey = new NodeRSA(req.body.publicKey);

	const username = req.session.username;
	const text = serverKey.decrypt(req.body.text, "utf8");

	Post.create(username, text)
	.then(post => post.save())
	.then(() => res.end());
});

app.listen(8000);
