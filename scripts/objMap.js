module.exports = function objMap(a, func) {
	const b = {};

	for(let key in a) {
		b[key] = func(a[key], key);
	}

	return b;
}
