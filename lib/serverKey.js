const fs = require("fs");
const NodeRSA = require("node-rsa");

let serverKey;
const keyFile = __dirname + "/../private.key";

try {
	const rawKey = fs.readFileSync(keyFile, "utf8");
	serverKey = new NodeRSA(rawKey);
	console.log("Read key from file.");
} catch(error) {
	console.log("Generating key.");
	serverKey = new NodeRSA({ b: 2048 });
	fs.writeFileSync(keyFile, serverKey.exportKey("pkcs8-private-pem"));
}

module.exports = serverKey;
