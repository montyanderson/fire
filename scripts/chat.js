const NodeRSA = require("node-rsa");
const Promise = window.Promise = require("bluebird");

const serverKey = new NodeRSA($("#publicKey").val());

console.log($("#publicKey").val());

Promise.resolve()
.then(() => {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve(new NodeRSA({ b: 1024 }));
		}, 0);
	});
})
.then(key => {
	const publicKey = key.exportKey("pkcs8-public-pem");
	console.log(publicKey);

	const peer = $("#peer").val().trim();

	function getLog(once) {
		$.post("/log/" + peer, { publicKey }, (res) => {
			const log = JSON.parse(key.decrypt(res, "utf8"));

			$(".chat")
			.html(
				log.map(m => $("<div>").text(m.username).html() + ": " + $("<div>").text(m.text).html())
				.join("<br>")
			);

			$(".chat").scrollTop($(".chat")[0].scrollHeight);


		}).always(() => {
			if(!once) {
				setTimeout(getLog, 1000);
			}
		});
	}

	getLog();

	$("#message").keypress(event => {
		if(event.which == 13) {
			$.ajax({
				type: "POST",
				url: "/send/" + peer,
				data: { message: serverKey.encrypt($("#message").val(), "base64") }
			}).done(() => {
				getLog(true);
			});

			$("#message").val("");
		}
	});
});
