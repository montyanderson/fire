const NodeRSA = require("node-rsa");
module.exports = new NodeRSA($("#publicKey").val());
