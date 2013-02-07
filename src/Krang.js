define(function() {

	var defines = [];

	function message(message) {
		var args = Array.prototype.slice.call(arguments);
		console.info.apply(console, ['[ KRANG ]'].concat(args));
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

	return {
		T_VALUE: 'VERBATIM VALUE',

		T_CONFIG: 'CONFIGURATION VALUE',
		T_GLOBAL: 'GLOBAL OBJECT REFERENCE',
		T_MODULE: 'MODULE OBJECT REFERENCE',

		T_RESOURCE: 'EXTERNAL RESOURCE',

		defines: defines,
		message: message,


		TypeException: TypeException,
		AliasException: AliasException,
		DataURIException: DataURIException,


		LoadException: LoadException
	};

});