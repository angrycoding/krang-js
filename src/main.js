define([
	'!global', 'Utils', 'Krang', 'Environment',
	'DependencyParser', 'DependencyBuilder', 'DependencyEvaluator'
], function(Global, Utils, Krang, Environment,
	DependencyParser, DependencyBuilder, DependencyEvaluator) {

	function Context(config) {

		function factory(newConfig) {

			Krang.message(
				'validating configuration:',
				Utils.json.stringify(newConfig)
			);

			var baseURI = config.baseURI;
			var newConfig = Utils.object.clone(newConfig);

			if (Utils.hasOwnProperty(newConfig, 'baseURI')) {
				if (Utils.isString(newConfig.baseURI)) {
					baseURI = newConfig.baseURI =
					Utils.uri.resolve(newConfig.baseURI, baseURI);
				} else delete newConfig.baseURI;
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

			newConfig = Utils.object.merge(config, newConfig);

			Krang.message(
				'new configuration is:',
				Utils.json.stringify(newConfig)
			);

			return Context(newConfig);
		}

		factory.version = Krang.VERSION;

		factory.require = function() {
			var deps = [], callback = null;
			var args = Array.prototype.slice.call(arguments);
			if (Utils.isString(args[0])) deps = [args.shift()];
			else if (Utils.isArray(args[0])) deps = args.shift();
			if (Utils.isFunction(args[0])) callback = args.shift();
			if (callback) DependencyParser(config, deps, function(deps) {
				DependencyEvaluator(config, deps, function(deps) {
					callback.apply(this, deps);
				}, factory);
			});
		};

		factory.build = function() {
			var deps = [], callback = null;
			var args = Array.prototype.slice.call(arguments);
			if (Utils.isString(args[0])) deps = [args.shift()];
			else if (Utils.isArray(args[0])) deps = args.shift();
			if (Utils.isFunction(args[0])) callback = args.shift();
			if (callback) DependencyParser(config, deps, function(deps) {
				Utils.mapAsync(deps, function(deps, ret) {
					DependencyBuilder(config, deps, ret, factory);
				}, function(deps) { callback.apply(this, deps); });
			});
		};

		return factory;
	};

	return Context({
		cache: true,
		baseURI: (
			Environment.nodejs && module.parent.filename ||
			Environment.browser && Global.location.href
		)
	});

});