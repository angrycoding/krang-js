define([
	'../Utils',
	'../Environment',
	'drivers/NodeDriver',
	'drivers/BrowserDriver'
], function(Utils, Environment, NodeDriver, BrowserDriver) {

	var driverInstance = null;

	if (Environment.nodejs) driverInstance = NodeDriver;
	else if (Environment.browser) driverInstance = BrowserDriver;

	return function(config, requestURI, success, fail) {
		if (!Utils.isString(requestURI)) return;
		if (!Utils.isFunction(fail)) fail = (function(){});
		if (!Utils.isFunction(success)) success = (function(){});

		if (!config.cache) {
			requestURI = Utils.uri.parse(requestURI);
			var query = Utils.uri.parseQuery(requestURI.query);
			query['krang.nocache'] = new Date().getTime();
			requestURI.query = Utils.uri.formatQuery(query);
			requestURI = Utils.uri.format(requestURI);
		}

		driverInstance(requestURI, success, fail);
	};

});