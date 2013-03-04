var FileSystem = require('fs');
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
	console.info('running', test.toString().replace(/\n+/g, ''));

	var expectedResult = testCase.expectedResult;
	expectedResult = JSON.stringify(expectedResult);

	test(Krang, function() {
		var actualResult = Array.prototype.slice.call(arguments);
		actualResult = JSON.stringify(actualResult);

		if (actualResult !== expectedResult) {
			console.info('expected', expectedResult);
			console.info('result', actualResult);
			throw 'x';
		}

		ret();
	});
}

var TestKrang = Krang({debug: true});

FileSystem.readdir('test/tests/', function(error, files) {
	forEachAsync(files, function(file, ret) {
		if (file.substr(-3) !== '.js') return ret();
		TestKrang.require('tests/' + file, function(testCases) {
			forEachAsync(testCases, runTestCase, ret);
		});
	}, function() {
		console.info('DONE ALL?');
	});
});