define(function() {

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

	function define(moduleID, args, ret) {
		var args = Array.prototype.slice.call(args);
		var dependencies, definition = args.shift();
		if (args.length) {
			dependencies = definition;
			definition = args.shift();
		}
		ret(dependencies, definition);
	}

	return {
		T_VALUE: 1,
		T_CONFIG: 2,
		T_GLOBAL: 3,
		T_MODULE: 4,
		T_RESOURCE: 5,

		VERSION: 0.3,

		message: message,
		define: define,

		TypeException: TypeException,
		AliasException: AliasException,
		DataURIException: DataURIException,
		LoadException: LoadException

	};

});