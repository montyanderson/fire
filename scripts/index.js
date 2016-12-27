const Promise = window.Promise = require("bluebird");
const cryptoPost = require("./cryptoPost");

if($(".chat")[0]) {
	require("./chat");
}

if($(".feed")[0]) {
	require("./feed");
}
