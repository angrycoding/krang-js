define([{
	test: function(Krang, ret) {
		Krang.require('data:,foobar', ret);
	},
	expectedResult: ['foobar']
}]);