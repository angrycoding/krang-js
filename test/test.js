var Krang = require('../krang.js');

function forEachAsync(list, iterator, ret) {
	if (!(list instanceof Object)) return ret();
	var keys, key, length, last;
	var i = -1, calls = 0, looping = false;
	if (list instanceof Array) {
		length = list.length;
	} else {
		keys = Object.keys(list);
		length = keys.length;
	}
	last = length - 1;
	var resume = function() {
		calls += 1;
		if (looping) return;
		looping = true;
		while (calls > 0) {
			calls -= 1, i += 1;
			if (i === length) return ret();
			key = (keys ? keys[i] : i);
			iterator(list[key], function(stop) {
				if (stop === true) ret();
				else resume();
			}, key, i, last);
		}
		looping = false;
	};
	resume();
}

function runTestCase(testCase, ret) {
	var test = testCase.test;
	var expected = testCase.expected;
	expected = JSON.stringify(expected);
	test(Krang, function() {
		var result = Array.prototype.slice.call(arguments);
		result = JSON.stringify(result);
		if (result !== expected) {
			console.info('expected', expected);
			console.info('result', result);
			throw 'x';
		}
		ret();
	});
}

Krang({
	debug: true
}).require('tests/base64.js', function(testCases) {

	forEachAsync(testCases, runTestCase, function() {
		console.info('done all');
	});

});