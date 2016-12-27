const Mustache = require("mustache");
const cryptoPost = require("./cryptoPost");
const reacts = require("../lib/reacts");

console.log(reacts);

cryptoPost("/api/feed").then(feed => {
	console.log(feed[0]);
	const html = feed.map(post => {
		console.log(post);

		return Mustache.render(`
		   <div class="row">
			   <div class="col s12">
				   <div class="card orange darken-1">
					   <div class="card-content white-text">
						   <span class="card-title">{{username}}</span>
						   <p>{{text}} ssd</p>
						   sdfsdfsdfsdfsdf
					   </div>

					   <div class="card-action">
						   {{#reacts}}
							   {{#users}}
							   	{{.}}
							   {{/users}}
						   {{/reacts}}
					   </div>
				   </div>
			   </div>
		   </div>
	   `, post);
	}).join("");

	$(".feed").html(html);
});
