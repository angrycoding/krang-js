(function(global) {

	{{var alias = this.alias}}
	{{var module = this.module}}

	{{for dependency in module}}
		{{var exportAs = dependency.exportAs}}
		{{var exportAs = dependency.main ? alias : exportAs}}
		{{if dependency.type is 'global'}}
			var {{exportAs}} = global;
		{{elseif dependency.type is 'module'}}
			var {{exportAs}} = {"uri": "MY_BASE_URI"};
		{{else}}
			var {{exportAs}} = {{dependency.data}};
		{{/if}}
	{{/for}}

	if (typeof this.process === 'object' &&
		typeof this.process.version === 'string' &&
		typeof module === 'object' &&
		typeof module.exports === 'object') {
		module.exports = {{alias}};
	} else if (typeof global.krang !== 'function' ||
		!global.define({{alias}})) {
		global[{{alias.toJSON()}}] = {{alias}};
	}

})(function() { return this; }.call(null));