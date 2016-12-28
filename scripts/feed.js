const Mustache = require("mustache");
const cryptoPost = require("./cryptoPost");
const reacts = require("../lib/reacts");

console.log(reacts);
function renderFeed() {
	cryptoPost("/api/feed").then(feed => {
		let html;

		html = feed.map(post => {
			post.reactsCommon = post.reacts.filter(r => r.users.length > 0).sort((a, b) => {
				return a.users.length < b.users.length;
			}).slice(0, 2);

			post.postid = post.id;

			return Mustache.render(`
				<div class="row">
					<div class="col s12">
						<div class="card blue lighten-2">
							<div class="card-content white-text">
								<span class="card-title">
									<h1>
										<span class="reactsCommon">
											{{#reactsCommon}}
												{{symbol}}
											{{/reactsCommon}}
										</span>

										{{username}}
									</h1>
								</span>
								<p class="flow-text">{{text}}</p>
							</div>

							<div class="card-action">
								<div class="row">
									{{#reacts}}
										<div class="col s2">
											<div class="row">
												<span class="react-button" data-react="{{id}}" data-post="{{postid}}">
													{{symbol}}
												</span>

												{{#users.0}}
													<ul class="collection white">
														{{#users}}
															<li>{{.}}</li>
														{{/users}}
													</ul>
												{{/users.0}}
											</div>
										</div>
									{{/reacts}}
								</div>
							</div>
						</div>
					</div>
				</div>
		   `, post)
		}).join("");
	   html = twemoji.parse(html);
		$(".feed").html(html);

		$(".react-button").click(function() {
			const react = $(this).attr("data-react");
			const post = $(this).attr("data-post");

			cryptoPost("/api/react", { react, post }, false).then(renderFeed);
		});
	});
}

renderFeed();

$("#text").keypress(event => {
	const t = $("#text").val();

	if(event.which == 13) {
		$(this).val("");
		cryptoPost("/api/post", { text: t }, false).then(renderFeed);
	}
});
