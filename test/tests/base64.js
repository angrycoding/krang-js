define([{
	test: function(Krang, ret) {
		Krang.require('data:,foobar', ret);
	},
	expectedResult: ['foobar']
}, {
	test: function(Krang, ret) {
		Krang.require('data:;base64,V09STEQ=', ret);
	},
	expectedResult: ['WORLD']
}]);