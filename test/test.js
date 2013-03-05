var Path = require('path');
var FileSystem = require('fs');
var Krang = require('../krang.js');

function getBaseType(value) {
	if (value === null) return 'null';
	if (value instanceof Array) return 'array';
	switch (typeof(value)) {
		case 'undefined': return 'undefined';
		case 'boolean': return 'boolean';
		case 'number': return 'number';
		case 'string': return 'string';
		case 'function': return 'function';
		case 'object': return 'object';
	}
}

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

function args2str() {
	var argument, result = [];
	for (var c = 0; c < arguments.length; c++) {
		argument = arguments[c];
		if (typeof argument === 'function') {
			argument = argument.toString();
			argument = argument.replace(/\n+/g, '');
			result.push(argument);
		} else if (typeof argument === 'object') {
			for (var key in argument) {
				if (!argument.hasOwnProperty(key)) continue;
				result.push(args2str(argument[key]));
			}
		} else result.push(argument);
	}
	return result;
}

function message() {
	var message = args2str(arguments);
	console.info(message.join(' '));
}

function success() {
	message('[ SUCCESS ]', arguments);
}

function compare(value1, value2) {
	var type1 = getBaseType(value1);
	var type2 = getBaseType(value2);
	if (type1 !== type2) return false;
	switch (type1) {
		case 'function':
			return compare(value1(), value2());
		case 'array':
			if (value1.length !== value2.length) return false;
			for (var c = 0; c < value1.length; c++)
				if (!compare(value1[c], value2[c])) return false;
			return true;
		case 'object':
			for (var key in value1) {
				if (!value1.hasOwnProperty(key)) continue;
				if (!value2.hasOwnProperty(key)) return false;
				if (!compare(value1[key], value2[key])) return false;
			}
			for (var key in value2) {
				if (!value2.hasOwnProperty(key)) continue;
				if (!value1.hasOwnProperty(key)) return false;
				if (!compare(value1[key], value2[key])) return false;
			}
			return true;
		default: return (value1 === value2);
	}
}

function runTestCase(Krang, testCase, ret) {
	var testFunc = testCase.test;
	var expectedResult = testCase.expectedResult;
	testFunc(Krang, function() {
		var actualResult = Array.prototype.slice.call(arguments);
		if (compare(actualResult, expectedResult)) {
			success(testFunc);
		} else {
			console.info('expected', expectedResult);
			console.info('result', actualResult);
			throw 'x';
		}

		ret();
	});
}

var TEST_DIR = Path.resolve(__dirname, 'tests');

FileSystem.readdir(TEST_DIR, function(error, files) {
	forEachAsync(files, function(fileName, ret) {
		if (fileName.substr(-3) !== '.js') return ret();
		var filePath = Path.resolve(TEST_DIR, fileName);
		message();
		message('TESTING:', filePath);
		message();
		Krang.require(filePath, function(testCases) {
			var testKrang = Krang({baseURI: filePath});
			forEachAsync(testCases, function(testCase, ret) {
				runTestCase(testKrang, testCase, ret);
			}, ret);
		});
	}, function() {
		console.info('DONE ALL?');
	});
});