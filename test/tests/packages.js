define([{
	test: function(Krang, ret) {
		Krang({
			packages: {
				'undefined': 'testresources/undefined',
				'null': 'testresources/null',
				'boolean-true': 'testresources/boolean-true',
				'boolean-false': 'testresources/boolean-false',
				'number': 'testresources/number',
				'string': 'testresources/string',
				'array': 'testresources/array',
				'map': 'testresources/map'
			}
		}).require([
			'@undefined',
			'@null',
			'@boolean-true',
			'@boolean-false',
			'@number',
			'@string',
			'@array',
			'@map'
		], ret);
	},
	expectedResult: [undefined, null, true, false, 42, 'hey', [1, 2, 3], {"foo": "bar"}]
}, {
	test: function(Krang, ret) {
		Krang({
			packages: {
				'undefined': 'testresources/undefined',
				'null': 'testresources/null',
				'boolean-true': 'testresources/boolean-true',
				'boolean-false': 'testresources/boolean-false',
				'number': 'testresources/number',
				'string': 'testresources/string',
				'array': 'testresources/array',
				'map': 'testresources/map'
			}
		})({
			packages: {
				'undefined': 'testresources/map'
			}
		}).require([
			'@undefined',
			'@null',
			'@boolean-true',
			'@boolean-false',
			'@number',
			'@string',
			'@array',
			'@map'
		], ret);
	},
	expectedResult: [{"foo": "bar"}, null, true, false, 42, 'hey', [1, 2, 3], {"foo": "bar"}]
}]);