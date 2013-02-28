define([
	'Utils', 'Krang', 'Environment',
	'DependencyParser', 'DependencyBuilder', 'DependencyEvaluator'
], function(Utils, Krang, Environment,
	DependencyParser, DependencyBuilder, DependencyEvaluator) {

	function parseArguments(arguments) {
		var dependencies = [], callback = null;
		var args = Array.prototype.slice.call(arguments);
		if (Utils.isString(args[0])) dependencies = [args.shift()];
		else if (Utils.isArray(args[0])) dependencies = args.shift();
		if (Utils.isFunction(args[0])) callback = args.shift();
		return [dependencies, callback];
	}

	function mergeConfigs(oldConfig, newConfig) {
		var baseURI = oldConfig.baseURI;
		var newConfig = Utils.object.clone(newConfig);
		if (Utils.hasOwnProperty(newConfig, 'baseURI')) {
			if (Utils.isString(newConfig.baseURI)) {
				baseURI = newConfig.baseURI =
				Utils.uri.resolve(newConfig.baseURI, baseURI);
			} else delete newConfig.baseURI;
		}
		if (Utils.hasOwnProperty(newConfig, 'cache') &&
			!Utils.isBoolean(newConfig.cache)) {
			newConfig.cache = String(newConfig.cache);
		}
		if (Utils.hasOwnProperty(newConfig, 'packages')) {
			var packages = newConfig.packages;
			if (Utils.isMap(packages)) {
				var packageID, packageURI;
				for (packageID in packages) {
					packageURI = packages[packageID];
					packageURI = Utils.string.trimLeft(packageURI);
					if (!Utils.isString(packageURI)) {
						delete packages[packageID];
					} else packages[packageID] = Utils.uri.resolve(
						packageURI, baseURI
					);
				}
			} else if (!Utils.isUndefined(packages)) {
				delete newConfig.packages;
			}
		}
		return Utils.object.merge(oldConfig, newConfig);
	}

	function Context(config) {

		if (config.debug) Krang.message(
			'applying configuration:',
			Utils.json.stringify(config)
		);

		function factory(newConfig) {
			return Context(mergeConfigs(config, newConfig));
		}

		factory.version = Krang.VERSION;

		factory.require = function() {
			var args = parseArguments(arguments);
			var deps = args[0], callback = args[1];
			if (callback) DependencyParser(config, deps, function(deps) {
				DependencyEvaluator(config, deps, function(deps) {
					callback.apply(this, deps);
				}, factory);
			});
		};

		factory.build = function() {
			var args = parseArguments(arguments);
			var deps = args[0], callback = args[1];
			if (callback) DependencyParser(config, deps, function(deps) {
				Utils.mapAsync(deps, function(deps, ret) {
					DependencyBuilder(config, deps, ret, factory);
				}, function(deps) { callback.apply(this, deps); });
			});
		};

		factory.getCurrentScript = Krang.getCurrentScript;

		return factory;
	};

	var rootContext = Context({
		cache: true,
		debug: false,
		baseURI: Krang.getBaseURI()
	});

	if (Environment.browser) {
		var currentScript = Krang.getCurrentScript();
		if (currentScript) {
			currentScript.parentNode.removeChild(currentScript);
			var mainScriptSrc = currentScript.getAttribute('data-main');
			var mainScriptBody = (currentScript.innerText || '');
			if (mainScriptSrc) rootContext.require(
				mainScriptSrc, new Function('main', mainScriptBody)
			); else if (mainScriptBody) new Function(mainScriptBody)();
		}
	}

	return rootContext;

});