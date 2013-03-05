define([{
	test: function(Krang, ret) { Krang.require('testresources/undefined', ret); },
	expectedResult: [undefined]
}, {
	test: function(Krang, ret) { Krang.require('testresources/undefined.js', ret); },
	expectedResult: [undefined]
}, {
	test: function(Krang, ret) { Krang.require('testresources/null', ret); },
	expectedResult: [null]
}, {
	test: function(Krang, ret) { Krang.require('testresources/null.js', ret); },
	expectedResult: [null]
}, {
	test: function(Krang, ret) { Krang.require('testresources/boolean-true', ret); },
	expectedResult: [true]
}, {
	test: function(Krang, ret) { Krang.require('testresources/boolean-true.js', ret); },
	expectedResult: [true]
}, {
	test: function(Krang, ret) { Krang.require('testresources/boolean-false', ret); },
	expectedResult: [false]
}, {
	test: function(Krang, ret) { Krang.require('testresources/boolean-false.js', ret); },
	expectedResult: [false]
}, {
	test: function(Krang, ret) { Krang.require('testresources/number', ret); },
	expectedResult: [42]
}, {
	test: function(Krang, ret) { Krang.require('testresources/number.js', ret); },
	expectedResult: [42]
}, {
	test: function(Krang, ret) { Krang.require('testresources/string', ret); },
	expectedResult: ['hey']
}, {
	test: function(Krang, ret) { Krang.require('testresources/string.js', ret); },
	expectedResult: ['hey']
}, {
	test: function(Krang, ret) { Krang.require('testresources/array', ret); },
	expectedResult: [[1, 2, 3]]
}, {
	test: function(Krang, ret) { Krang.require('testresources/array.js', ret); },
	expectedResult: [[1, 2, 3]]
}, {
	test: function(Krang, ret) { Krang.require('testresources/map', ret); },
	expectedResult: [{"foo": "bar"}]
}, {
	test: function(Krang, ret) { Krang.require('testresources/map.js', ret); },
	expectedResult: [{"foo": "bar"}]
}, {
	test: function(Krang, ret) { Krang.require('testresources/function-undefined', ret); },
	expectedResult: [undefined]
}, {
	test: function(Krang, ret) { Krang.require('testresources/function-undefined.js', ret); },
	expectedResult: [undefined]
}, {
	test: function(Krang, ret) { Krang.require('testresources/function-null', ret); },
	expectedResult: [null]
}, {
	test: function(Krang, ret) { Krang.require('testresources/function-null.js', ret); },
	expectedResult: [null]
}, {
	test: function(Krang, ret) { Krang.require('testresources/function-boolean-true', ret); },
	expectedResult: [true]
}, {
	test: function(Krang, ret) { Krang.require('testresources/function-boolean-true.js', ret); },
	expectedResult: [true]
}, {
	test: function(Krang, ret) { Krang.require('testresources/function-boolean-false', ret); },
	expectedResult: [false]
}, {
	test: function(Krang, ret) { Krang.require('testresources/function-boolean-false.js', ret); },
	expectedResult: [false]
}, {
	test: function(Krang, ret) { Krang.require('testresources/function-number', ret); },
	expectedResult: [42]
}, {
	test: function(Krang, ret) { Krang.require('testresources/function-number', ret); },
	expectedResult: [42]
}, {
	test: function(Krang, ret) { Krang.require('testresources/function-string', ret); },
	expectedResult: ['string']
}, {
	test: function(Krang, ret) { Krang.require('testresources/function-string', ret); },
	expectedResult: ['string']
}, {
	test: function(Krang, ret) { Krang.require('testresources/function-function', ret); },
	expectedResult: [function() { return 'result'; }]
}, {
	test: function(Krang, ret) { Krang.require('testresources/function-function', ret); },
	expectedResult: [function() { return 'result'; }]
}, {
	test: function(Krang, ret) { Krang.require('testresources/function-array', ret); },
	expectedResult: [function() { return [1, 2, 3]; }]
}, {
	test: function(Krang, ret) { Krang.require('testresources/function-array.js', ret); },
	expectedResult: [function() { return [1, 2, 3]; }]
}, {
	test: function(Krang, ret) { Krang.require('testresources/function-map', ret); },
	expectedResult: [function() { return {"foo": "bar"}; }]
}, {
	test: function(Krang, ret) { Krang.require('testresources/function-map.js', ret); },
	expectedResult: [function() { return {"foo": "bar"}; }]
}, {
	test: function(Krang, ret) { Krang.require([
		'testresources/undefined',
		'testresources/null'
	], ret); },
	expectedResult: [undefined, null]
}, {
	test: function(Krang, ret) { Krang.require([
		'testresources/null',
		'testresources/boolean-true'
	], ret); },
	expectedResult: [null, true]
}, {
	test: function(Krang, ret) { Krang.require([
		'testresources/boolean-true',
		'testresources/boolean-false'
	], ret); },
	expectedResult: [true, false]
}, {
	test: function(Krang, ret) { Krang.require([
		'testresources/boolean-false',
		'testresources/number'
	], ret); },
	expectedResult: [false, 42]
}, {
	test: function(Krang, ret) { Krang.require([
		'testresources/number',
		'testresources/string'
	], ret); },
	expectedResult: [42, 'hey']
}, {
	test: function(Krang, ret) { Krang.require([
		'testresources/string',
		'testresources/array'
	], ret); },
	expectedResult: ['hey', [1, 2, 3]]
}, {
	test: function(Krang, ret) { Krang.require([
		'testresources/array',
		'testresources/map'
	], ret); },
	expectedResult: [[1, 2, 3], {"foo": "bar"}]
}, {
	test: function(Krang, ret) { Krang.require([
		'testresources/array',
		'testresources/map'
	], ret); },
	expectedResult: [[1, 2, 3], {"foo": "bar"}]
}]);