define([
	'!global', 'Krang', 'Utils', 'DependencyParser', 'ResourceLoader'
], function(Global, Krang, Utils, DependencyParser, ResourceLoader) {

	function DependencyEvaluator(config, dependencies, ret, krang, isBuildTime) {

		function evaluateDependencies(dependencies, ret) {
			Utils.mapAsync(dependencies, function(dependency, ret) {
				var baseURI = dependency.base;

				if (dependency.type === Krang.T_RESOURCE) {
					var resourceURI = dependency.uri;
					var pluginURI = dependency.data;
					ResourceLoader(resourceURI, 'evaluated', function(resourceData) {
						if (pluginURI &&
							Utils.hasOwnProperty(resourceData, 'krang') &&
							Utils.isFunction(resourceData.krang)) {
							resourceData.krang(baseURI, pluginURI, ret, krang, isBuildTime);
						} else ret(resourceData);
					}, function(resourceURI, ret) {
						if (config.debug) Krang.message('evaluating', resourceURI);
						var resource = ResourceLoader(resourceURI);
						var def = resource[1], deps = resource[0];
						if (!Utils.isFunction(def)) return ret(def);
						evaluateDependencies(deps, function(deps) {
							ret(def.apply(this, deps));
						});
					});
				}

				else if (dependency.type === Krang.T_GLOBAL) {
					ret(Global);
				}

				else if (dependency.type === Krang.T_MODULE) {
					ret({uri: baseURI});
				}

				else if (dependency.type === Krang.T_CONFIG) {
					ret(config.config);
				}

				else if (dependency.type === Krang.T_VALUE) {
					ret(dependency.data);
				}

			}, ret);
		}

		evaluateDependencies(dependencies, ret);

	}

	return DependencyEvaluator;

});