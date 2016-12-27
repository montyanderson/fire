const db = require("./db");
const reacts = require("./reacts");

console.log(reacts);

class Post {
	constructor() {

	}

	validate() {

	}

	static feed() {
		return Promise.resolve().then(() => {
			return db.smembersAsync("fire:users")
		}).then(users => {
			console.log(users);
			return Promise.all(users.map(username => {
				return db.zrangebyscoreAsync("fire:user-posts:" + username, 0, Infinity)
			}));

		}).then(postsByUser => {
			console.log(postsByUser);
			const posts = [].concat(...postsByUser);
			return Promise.all(posts.map(post => Post.get(post)));
		});
	}

	static create(username, text) {
		return Promise.resolve().then(() => {
			const post = new Post();

			post.username = username;
			post.text = text;

			return db.incrAsync("fire:counter:posts")
			.then(id => {
				post.id = id;
				return post;
			})
		});
	}

	static react(id, username, reactID) {
		return db.sismemberAsync("fire:users", username)
		.then(res => {
			if(!res) {
				throw new Error("User doesn't exist!");
			}
		})
		.then(() => {
			if(reacts.map(r => r.id).indexOf(reactID) < 0) {
				throw new Error("React doesn't exist!");
			}
		})
		.then(() => {
			return db.zaddAsync("fire:post:" + id + ":reacts", reactID, username);
		})
	}

	static get(id) {
		return Promise.resolve().then(() => {
			const post = new Post();

			post.id = id;

			return db.getAsync("fire:post:" + id).then(data => {
				Object.assign(post, JSON.parse(data));
			}).then(() => {
				return db.zrangebyscoreAsync("fire:post:" + id + ":reacts", 0, Infinity, "WITHSCORES")
				.then(r => {
					const pr = {};

					reacts.forEach(r => {
						pr[r.id] = {
							name: r.name,
							id: r.id,
							symbol: r.symbol,
							users: []
						}
					});

					for(let i = 0; i < r.length; i += 2) {
						const username = r[i];
						const react = r[i + 1];
						pr[react].users.push(username);
					}

					return pr;
				});
			}).then(pr => {
				post.reacts = pr;
				return post;
			});
		});
	}

	save() {
		return Promise.resolve().then(() => {
			return db.sismemberAsync("fire:users", this.username).then(res => {
				if(!res) throw new Error("User does not exist!");
			});
		}).then(() => {
			return db.multi()
			.set("fire:post:" + this.id, JSON.stringify({
				username: this.username,
				text: this.text
			}))
			.zadd("fire:user-posts:" + this.username, "NX", Date.now(), this.id)
			.execAsync();
		});
	}
}

module.exports = Post;
