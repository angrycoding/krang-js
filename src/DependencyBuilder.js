define([
	'Krang', 'Utils', 'ResourceLoader', 'DependencyEvaluator'
], function(Krang, Utils, ResourceLoader, DependencyEvaluator) {

	function serialize(def, deps) {
		if (Utils.isFunction(def)) {
			return '(' + String(def) + ')(' + deps + ')';
		} else if (Utils.isUndefined(def)) {
			return 'undefined';
		} else return JSON.stringify(def);
	}

	function buildDependencies(config, dependencies, ret, krang) {

		var result = [], processed = {};

		function buildDependencies(dependencies, ret, isMain) {
			Utils.mapAsync(dependencies, function(dependency, ret) {

				var exportAs = dependency.id;

				if (!processed.hasOwnProperty(exportAs)) {
					processed[exportAs] = true;
				} else return ret(exportAs);

				var dependencyType = dependency.type;

				if (dependencyType === Krang.T_RESOURCE) {

					var pluginURI = dependency.data;
					var resource = ResourceLoader(dependency.uri);
					var def = resource[1], deps = resource[0];

					if (pluginURI) {

						return DependencyEvaluator(config, dependency, function(dependency) {

							var dependency = dependency[0];
							for (var c = 0; c < dependency.length; c++) {

								if (!processed.hasOwnProperty(
									dependency[c].exportAs
								)) {
									if (dependency[c].main) {
										dependency[c].main = isMain;
										dependency[c].exportAs = exportAs;
									}
									result.push(dependency[c]);
								}

							}

							ret(exportAs);

						}, krang, true);

					} else {

						return buildDependencies(deps, function(deps) {
							result.push({
								type: 'value',
								main: isMain,
								exportAs: exportAs,
								data: serialize(def, deps)
							});
							ret(exportAs);
						});

					}

				}

				else if (dependencyType === Krang.T_GLOBAL) {
					result.push({
						type: 'global',
						main: isMain,
						exportAs: exportAs,
						data: dependency.data
					});
				}

				else if (dependencyType === Krang.T_MODULE) {
					result.push({
						type: 'module',
						main: isMain,
						exportAs: exportAs,
						data: dependency.data
					});
				}

				else if (dependencyType === Krang.T_CONFIG) {
					result.push({
						type: 'value',
						main: isMain,
						exportAs: exportAs,
						data: serialize(config.config)
					});
				}

				else if (dependencyType === Krang.T_VALUE) {
					result.push({
						type: 'value',
						main: isMain,
						exportAs: exportAs,
						data: serialize(dependency.data)
					});
				}



				ret(exportAs);

			}, ret);
		}



		buildDependencies(dependencies, function() {
			ret(result);
		}, true);


	}

	return buildDependencies;

});