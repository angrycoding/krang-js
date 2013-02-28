define(['../../Utils', '../../Krang'], function(Utils, Krang) {

	var URL, Schemes;
	var initialized = false;

	function initialize() {

		if (initialized) return;
		initialized = true;

		URL = require('url');
		Schemes = {
			'file': require('fs'),
			'http': require('http'),
			'https': require('https')
		};
	}

	function Driver(requestURI, success, fail) {

		initialize();

		var requestObj = Utils.uri.parse(requestURI);
		var requestScheme = (requestObj.scheme || 'file');

		if (requestScheme === 'http' || requestScheme === 'https') {

			Schemes[requestScheme].request({

				method: 'GET',
				path: [
					requestObj.path,
					requestObj.query
				].join('?'),
				hostname: requestObj.authority

			}, function(response) {

				if (response.statusCode > 300 &&
					response.statusCode < 400 &&
					response.headers.location) {

					var toURI = URL.parse(response.headers.location);
					if (!toURI.port) toURI.port = requestObj.port;
					if (!toURI.host) toURI.host = requestObj.host;
					if (!toURI.hostname) toURI.hostname = requestObj.hostname;
					if (!toURI.protocol) toURI.protocol = requestObj.protocol;
					return doHTTPRequest(toURI, success, fail);

				}

				var data = '';
				response.on('end', function() {
					try {

						var hasDefinition = false;
						var runner = new Function('define, require, module', data);
						runner.currentScript = requestURI;

						runner(function() {
							hasDefinition = true;
							Krang.define(requestURI, arguments, success);
						}, require, module);

						if (!hasDefinition) {
							throw new Krang.MissingDefinition(requestURI);
						}

					} catch (exception) {
						fail(exception);
					}
				}).on('data', function(chunk) { data += chunk; });

			}).on('error', fail).end();

		} else if (requestScheme === 'file') {

			Schemes[requestScheme].readFile(
				requestObj.path, function(error, data) {
					if (error) return fail(error);
					try {

						new Function('define, require, module', data.toString())(function() {
							Krang.define(requestURI, arguments, success);
						}, require, module);

					} catch (exception) {
						fail(exception);
					}
				}
			);

		} else fail('unsupported scheme:' + requestScheme);
	}

	return Driver;
});