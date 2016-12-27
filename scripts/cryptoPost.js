const serverKey = require("./serverKey");
const clientKey = require("./clientKey");
const objMap = require("./objMap");

module.exports = function cryptoPost(url, data = {}, expectResponse = true) {
	return new Promise((resolve, reject) => {
		const body = objMap(data, value => serverKey.encrypt(value, "base64"));

		body.publicKey = clientKey.exportKey("pkcs8-public-pem");

		console.log("wooo!");

		$.ajax({
			type: "POST",
			url,
			data: body
		}).done(res => {
			if(expectResponse) {
				resolve(JSON.parse(clientKey.decrypt(res, "utf8")));
			} else {
				resolve();
			}
		}).fail(reject);
	});
}
