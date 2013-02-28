define([
	'Utils', 'Krang',
	'Environment', 'ResourceLoader',
	'ScriptTransport/ScriptTransport',
	'ExpressionEngine/ExpressionEngine'
], function(Utils, Krang, Environment,
	ResourceLoader, ScriptTransport, ExpressionEngine) {

	var expressionEngine = new ExpressionEngine(Environment);

	function decodeDataURI(baseURI, dataURI) {
		var uriObj = Utils.uri.parseData(dataURI);
		var requestData = uriObj.data;
		try {
			if (uriObj.encoding === 'base64')
				requestData = Utils.base64decode(requestData);
			else requestData = decodeURIComponent(requestData);
			if (uriObj.type === 'application/json')
				requestData = Utils.json.parse(requestData);
			return requestData;
		} catch (exception) {
			throw new Krang.DataURIException(
				baseURI, dataURI,
				exception.message || exception
			);
		}
	}

	function resolveDependencyURI(dependencyURI, baseURI) {
		var dependencyURI = Utils.uri.parse(dependencyURI);
		dependencyURI.fragment = '';
		dependencyURI.path = dependencyURI.path.replace(/\/+/g, '/');
		if (dependencyURI.fileName && !dependencyURI.fileType)
			dependencyURI.path += '.js';
		return Utils.uri.resolve(dependencyURI, baseURI);
	}


	var hashTable = {};
	var lastID = 0;

	function uniqueId(prefix) {
		if (!Utils.isString(prefix)) prefix = '';
		var partOne = new Date().getTime();
		return (prefix + partOne.toString(36) +
			(1 + Math.floor((Math.random()*32767))).toString(36) +
			(1 + Math.floor((Math.random()*32767))).toString(36)
		);
	}

	function nextID() {
		return uniqueId('__KRANG' + (++lastID) + '__') + '__';
	}

	function generateID(hash) {
		if (!Utils.isUndefined(hash)) hash = String(hash);
		return (hash ? (hashTable.hasOwnProperty(hash) ?
			hashTable[hash] : hashTable[hash] = nextID()
		) : nextID());
	}

	return function(config, dependencies, ret) {

		function loadResource(resourceURI, ret, baseURI) {
			if (config.debug) Krang.message('loading', resourceURI);
			ScriptTransport(config, resourceURI, function(deps, def) {
				parseDependencies(resourceURI, deps, function(deps) {
					ret([deps, def]);
				});
			}, function(message) {
				throw new Krang.LoadException(
					baseURI, resourceURI, message
				);
			});
		}

		function resolveAlias(baseURI, alias, pluginURI, ret) {
			if (Utils.hasOwnProperty(config, 'packages') &&
				Utils.hasOwnProperty(config.packages, alias)) {
				alias = config.packages[alias];
				if (pluginURI) alias += ('!' + pluginURI);
				return parseDependencyString(baseURI, alias, ret);
			} else throw new Krang.AliasException(baseURI, alias);
		}

		function parseDependencyString(baseURI, dependencyURI, ret) {

			var dependencyURI = Utils.string.trimLeft(dependencyURI);

			if (Utils.string.startsWith(dependencyURI, 'data:', true)) {
				return ret({
					type: Krang.T_VALUE, base: baseURI,
					data: decodeDataURI(baseURI, dependencyURI)
				});
			}

			dependencyURI = Utils.string.trimRight(dependencyURI);
			var pluginURI = dependencyURI.replace(/\s*!+\s*/g, '!');
			pluginURI = pluginURI.split('!');

			if (pluginURI[0] === 'module') pluginURI.unshift('');

			if (dependencyURI = pluginURI.shift()) {
				pluginURI = pluginURI.join('!');
				if (dependencyURI[0] === '@') {
					dependencyURI = dependencyURI.substr(1);
					return resolveAlias(baseURI, dependencyURI, pluginURI, ret);
				}
				dependencyURI = resolveDependencyURI(dependencyURI, baseURI);
				ResourceLoader(dependencyURI, function() {
					ret({
						id: generateID(['resource', dependencyURI, pluginURI]),
						type: Krang.T_RESOURCE, base: baseURI,
						uri: dependencyURI, data: pluginURI
					});
				}, loadResource, baseURI);
			}

			else if (pluginURI[0] === 'global') return ret({
				id: generateID(['global', pluginURI]),
				type: Krang.T_GLOBAL, base: baseURI,
				data: pluginURI
			});

			else if (pluginURI[0] === 'module') return ret({
				id: generateID(['module', baseURI, pluginURI]),
				type: Krang.T_MODULE, base: baseURI,
				data: pluginURI
			});

			else if (pluginURI[0] === 'config') return ret({
				id: generateID(['config', pluginURI, JSON.stringify(config.config)]),
				type: Krang.T_CONFIG, base: baseURI,
				data: pluginURI
			});

			else throw ('Unknown system plugin call: ' + pluginURI[0]);

		}

		function parseDependencyMap(baseURI, dependency, ret) {
			for (var expression in dependency) {
				if (expressionEngine(expression, baseURI)) {
					return parseDependency(
						baseURI,
						dependency[expression],
						ret
					);
				}
			}
			ret();
		}

		function parseDependency(baseURI, dependency, ret) {
			if (Utils.isString(dependency))
				parseDependencyString(baseURI, dependency, ret);
			else if (Utils.isMap(dependency))
				parseDependencyMap(baseURI, dependency, ret);
			else throw new Krang.TypeException(baseURI, dependency);
		}

		function parseDependencies(baseURI, dependencies, ret) {
			Utils.mapAsync(dependencies, function(dependency, ret) {
				parseDependency(baseURI, dependency, ret);
			}, ret);
		}

		parseDependencies(config.baseURI, dependencies, ret);

	};

});