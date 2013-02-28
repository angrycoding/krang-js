define(['!global', '!module', 'Environment'], function(Global, Module, Environment) {

	var scripts = [];
	var defined = {};

	if (Environment.browser && Global.document &&
		Global.document.getElementsByTagName) {
		scripts = document.getElementsByTagName('script');
	}

	function message(message) {
		var args = Array.prototype.slice.call(arguments);
		args.unshift('[ KRANG ]');
		console.log(args.join(' '));
	}

	function KrangException(file, message) {
		return {
			file: file,
			toString: function() { return message; }
		};
	}

	function TypeException(file, dependency) {
		return KrangException(file, (
			'dependency must be a string, array or map, but "' +
			dependency + '" found (' + file + ')'
		));
	}

	function DataURIException(file, dataURI, message) {
		return KrangException(file, (
			'error decoding "' +
			dataURI + '" with message "' +
			message + '" (' + file + ')'
		));
	}

	function AliasException(file, dependency) {
		return KrangException(file, (
			'failed to resolve dependency alias "@' +
			dependency + '" for "' + file + '"'
		));
	}

	function LoadException(file, dependency, message) {
		return KrangException(file, (
			'failed to load dependency "' +
			dependency + '" for "' + file + '" ' +
			'with message "' + message + '"'
		));
	}

	function MissingDefinition(file) {
		return KrangException(file, (
			'failed to load dependency "' + file + '" ' +
			'with message "missing required define call"'
		));
	}

	function DuplicateDefinition(file) {
		return KrangException(file, (
			'failed to load dependency "' + file + '" ' +
			'with message "duplicate define call"'
		));
	}

	function define(moduleID, args, ret) {
		if (!defined.hasOwnProperty(moduleID)) {
			defined[moduleID] = true;
			var args = Array.prototype.slice.call(args);
			var dependencies, definition = args.shift();
			if (args.length) {
				dependencies = definition;
				definition = args.shift();
			}
			ret(dependencies, definition);
		} else throw new DuplicateDefinition(moduleID);
	}

	function getBaseURI() {
		if (Environment.nodejs) return module.parent.filename;
		if (Environment.browser) return Global.location.href;
	}

	function getCurrentScript() {
		var caller;

		if (caller = arguments.callee.caller) {
			do {
				if (!caller.hasOwnProperty('currentScript')) continue;
				return {src: caller.currentScript};
			} while (caller = caller.caller);
		}

		if (!Environment.browser) return;

		if (Global.document && Global.document.currentScript) {
			return Global.document.currentScript;
		}

		else try { throw new Error(); } catch (exception) {

			if (exception.stack) {
				caller = exception.stack;
				if (caller.indexOf('@') === -1) {
					caller = caller.split('\n').pop();
					caller = caller.split(' ').pop();
				} else caller = caller.split('@').pop();
				caller = caller.split(/(\:\d+)+\s*$/).shift();
				for (var c = 0; c < scripts.length; c++) {
					if (scripts[c].src !== caller) continue;
					return scripts[c];
				}
			}

			else for (var c = 0; c < scripts.length; c++) {
				if (scripts[c].readyState !== 'interactive') continue;
				return scripts[c];
			}

		}
	}

	return {
		T_VALUE: 1,
		T_CONFIG: 2,
		T_GLOBAL: 3,
		T_MODULE: 4,
		T_RESOURCE: 5,

		VERSION: 0.4,

		message: message,
		define: define,
		getBaseURI: getBaseURI,
		getCurrentScript: getCurrentScript,

		TypeException: TypeException,
		AliasException: AliasException,
		DataURIException: DataURIException,
		LoadException: LoadException,
		MissingDefinition: MissingDefinition

	};

});