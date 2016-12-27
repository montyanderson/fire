const cryptoPost = require("./cryptoPost");
const peer = $("#peer").val().trim();

function getLog(once) {
	cryptoPost("/log/" + peer)
	.then(log => {
		$(".chat")
		.html(
			log.map(m => $("<div>").text(m.username).html() + ": " + $("<div>").text(m.text).html())
			.join("<br>")
		);

		$(".chat").scrollTop($(".chat")[0].scrollHeight);

		if(!once) {
			setTimeout(getLog, 1000);
		}
	}).catch(() => {
		if(!once) {
			setTimeout(getLog, 1000);
		}
	});
}

getLog();

$("#message").keypress(event => {
	if(event.which == 13) {
		cryptoPost("/send/" + peer, { message: $("#message").val() }, false)
		.then(() => {
			getLog(true);
		});

		$("#message").val("");
	};
});
