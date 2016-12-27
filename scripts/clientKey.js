const NodeRSA = require("node-rsa");

if(!localStorage.clientKey) {
	const clientKey = module.exports = new NodeRSA({ b: 1536 });
	localStorage.clientKey = clientKey.exportKey("pkcs8-private-pem");
} else {
	module.exports = new NodeRSA(localStorage.clientKey);
}

console.log(module.exports);
