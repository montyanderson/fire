const Post = require("./Post");

Post.create("monty", "hey joe : )!")
.then(post => {
	Post.react(9, "monty", 3);
	Post.feed().then(a => {
		a.forEach(b => console.log(b));
	});
});
