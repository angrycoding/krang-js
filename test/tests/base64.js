define([{
	test: function(Krang, ret) {
		Krang.require('data:,foobar', ret);
	},
	expected: ['foobar']
}, {
	test: function(Krang, ret) {
		Krang.require('data:;base64,V09STEQ=', ret);
	},
	expected: ['WORLD']
}]);