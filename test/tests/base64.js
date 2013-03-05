define([{
	test: function(Krang, ret) { Krang.require('data:', ret); },
	expectedResult: [undefined]
}, {
	test: function(Krang, ret) { Krang.require('data:fgdgg', ret); },
	expectedResult: [undefined]
}, {
	test: function(Krang, ret) { Krang.require('data:,', ret); },
	expectedResult: ['']
}, {
	test: function(Krang, ret) { Krang.require('data:sadfasdfdsf,', ret); },
	expectedResult: ['']
}, {
	test: function(Krang, ret) { Krang.require('DATA:;base64,eyJIRUxMTyI6ICJXT1JMRCEifQ==', ret); },
	expectedResult: ['{"HELLO": "WORLD!"}']
}, {
	test: function(Krang, ret) { Krang.require('DATA:;base64,eyJIRUxMTyI6ICJXT1JMRCEifQ==', ret); },
	expectedResult: ['{"HELLO": "WORLD!"}']
}, {
	test: function(Krang, ret) { Krang.require('DATA:;base64,eyJIRUxMTyI6ICJXT1JMRCEifQ==#dsdfddffd', ret); },
	expectedResult: [undefined]
}, {
	test: function(Krang, ret) { Krang.require('DATA:;base64,eyJIRUxMTyI6ICJXT1JMRCEifQ==!hey', ret); },
	expectedResult: [undefined]
}, {
	test: function(Krang, ret) { Krang.require('DATA:;base64,eyJIRUxMTyI6ICJ!XT1JMRCEifQ==#swwwdddffd', ret); },
	expectedResult: [undefined]
}, {
	test: function(Krang, ret) { Krang.require('data:,%3C!DOCTYPE%20html%3E%3Chtml%20lang%3D%22en%22%3E%3Chead%3E%3Ctitle%3EEmbedded%20Window%3C%2Ftitle%3E%3C%2Fhead%3E%3Cbody%3E%3Ch1%3E42%3C%2Fh1%3E%3C%2Fbody%3E%3C%2Fhtml%3E', ret); },
	expectedResult: ['<!DOCTYPE html><html lang="en"><head><title>Embedded Window</title></head><body><h1>42</h1></body></html>']
}, {
	test: function(Krang, ret) { Krang.require('data:application/json;,{"foo":"bar", "X": "Y"}', ret); },
	expectedResult: [{ foo: 'bar', X: 'Y' }]
}, {
	test: function(Krang, ret) { Krang.require('      data:application/x;base64,eyJIRUxMTyI6ICJXT1JMRCEifQ==', ret); },
	expectedResult: ['{"HELLO": "WORLD!"}']
}, {
	test: function(Krang, ret) { Krang.require('      data:application/x;base64,eyJIRUxMTyI6ICJXT1JMRCEifQ==   ', ret); },
	expectedResult: [undefined]
}, {
	test: function(Krang, ret) { Krang.require('      data:application/jsxon,     12     ', ret); },
	expectedResult: ['     12     ']
}, {
	test: function(Krang, ret) { Krang.require('      data:application/jsxon,     12   ,    92  ', ret); },
	expectedResult: ['     12   ,    92  ']
}, {
	test: function(Krang, ret) { Krang.require('      data:application/json,     12   ', ret); },
	expectedResult: [12]
}, {
	test: function(Krang, ret) { Krang.require('data:,,,,', ret); },
	expectedResult: [',,,']
}, {
	test: function(Krang, ret) { Krang.require('data:,foobar', ret); },
	expectedResult: ['foobar']
}, {
	test: function(Krang, ret) { Krang.require('data:,foo,bar', ret); },
	expectedResult: ['foo,bar']
}, {
	test: function(Krang, ret) { Krang.require('data:;base64,V09STEQ=', ret); },
	expectedResult: ['WORLD']
}, {
	test: function(Krang, ret) { Krang.require('data:;base64,FFJFJJF', ret); },
	expectedResult: [undefined]
}, {
	test: function(Krang, ret) { Krang.require('data:application/json,undefined', ret); },
	expectedResult: [undefined]
}, {
	test: function(Krang, ret) { Krang.require('data:application/json,null', ret); },
	expectedResult: [null]
}, {
	test: function(Krang, ret) { Krang.require('data:application/json,123', ret); },
	expectedResult: [123]
}, {
	test: function(Krang, ret) { Krang.require('data:application/json,"string"', ret); },
	expectedResult: ["string"]
}, {
	test: function(Krang, ret) { Krang.require('data:application/json,[true, false]', ret); },
	expectedResult: [[true, false]]
}, {
	test: function(Krang, ret) { Krang.require('data:application/json,{"foo":"bar"}', ret); },
	expectedResult: [{"foo": "bar"}]
}, {
	test: function(Krang, ret) { Krang.require('data:;base64,eyJIRUxMTyI6ICJXT1JMRCEifQ==', ret); },
	expectedResult: ['{"HELLO": "WORLD!"}']
}, {
	test: function(Krang, ret) { Krang.require('data:application/json;base64,eyJIRUxMTyI6ICJXT1JMRCEifQ==', ret); },
	expectedResult: [{"HELLO": "WORLD!"}]
}]);