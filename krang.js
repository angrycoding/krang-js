(function(global) {








			var __KRANG1__ = global;





			var __KRANG5__ = (function () {
  var number
	  = '(?:-?\\b(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?\\b)';
  var oneChar = '(?:[^\\0-\\x08\\x0a-\\x1f\"\\\\]'
	  + '|\\\\(?:[\"/\\\\bfnrt]|u[0-9A-Fa-f]{4}))';
  var string = '(?:\"' + oneChar + '*\")';

  // Will match a value in a well-formed JSON file.
  // If the input is not well-formed, may match strangely, but not in an unsafe
  // way.
  // Since this only matches value tokens, it does not match whitespace, colons,
  // or commas.
  var jsonToken = new RegExp(
	  '(?:false|true|null|[\\{\\}\\[\\]]'
	  + '|' + number
	  + '|' + string
	  + ')', 'g');

  // Matches escape sequences in a string literal
  var escapeSequence = new RegExp('\\\\(?:([^u])|u(.{4}))', 'g');

  // Decodes escape sequences in object literals
  var escapes = {
	'"': '"',
	'/': '/',
	'\\': '\\',
	'b': '\b',
	'f': '\f',
	'n': '\n',
	'r': '\r',
	't': '\t'
  };
  function unescapeOne(_, ch, hex) {
	return ch ? escapes[ch] : String.fromCharCode(parseInt(hex, 16));
  }

  // A non-falsy value that coerces to the empty string when used as a key.
  var EMPTY_STRING = new String('');
  var SLASH = '\\';

  // Constructor to use based on an open token.
  var firstTokenCtors = { '{': Object, '[': Array };

  var hop = Object.hasOwnProperty;

  function JSONParse(json, opt_reviver) {
	// Split into tokens
	var toks = json.match(jsonToken);
	// Construct the object to return
	var result;
	var tok = toks[0];
	var topLevelPrimitive = false;
	if ('{' === tok) {
	  result = {};
	} else if ('[' === tok) {
	  result = [];
	} else {
	  // The RFC only allows arrays or objects at the top level, but the JSON.parse
	  // defined by the EcmaScript 5 draft does allow strings, booleans, numbers, and null
	  // at the top level.
	  result = [];
	  topLevelPrimitive = true;
	}

	// If undefined, the key in an object key/value record to use for the next
	// value parsed.
	var key;
	// Loop over remaining tokens maintaining a stack of uncompleted objects and
	// arrays.
	var stack = [result];
	for (var i = 1 - topLevelPrimitive, n = toks.length; i < n; ++i) {
	  tok = toks[i];

	  var cont;
	  switch (tok.charCodeAt(0)) {
		default:  // sign or digit
		  cont = stack[0];
		  cont[key || cont.length] = +(tok);
		  key = void 0;
		  break;
		case 0x22:  // '"'
		  tok = tok.substring(1, tok.length - 1);
		  if (tok.indexOf(SLASH) !== -1) {
			tok = tok.replace(escapeSequence, unescapeOne);
		  }
		  cont = stack[0];
		  if (!key) {
			if (cont instanceof Array) {
			  key = cont.length;
			} else {
			  key = tok || EMPTY_STRING;  // Use as key for next value seen.
			  break;
			}
		  }
		  cont[key] = tok;
		  key = void 0;
		  break;
		case 0x5b:  // '['
		  cont = stack[0];
		  stack.unshift(cont[key || cont.length] = []);
		  key = void 0;
		  break;
		case 0x5d:  // ']'
		  stack.shift();
		  break;
		case 0x66:  // 'f'
		  cont = stack[0];
		  cont[key || cont.length] = false;
		  key = void 0;
		  break;
		case 0x6e:  // 'n'
		  cont = stack[0];
		  cont[key || cont.length] = null;
		  key = void 0;
		  break;
		case 0x74:  // 't'
		  cont = stack[0];
		  cont[key || cont.length] = true;
		  key = void 0;
		  break;
		case 0x7b:  // '{'
		  cont = stack[0];
		  stack.unshift(cont[key || cont.length] = {});
		  key = void 0;
		  break;
		case 0x7d:  // '}'
		  stack.shift();
		  break;
	  }
	}
	// Fail if we've got an uncompleted object.
	if (topLevelPrimitive) {
	  if (stack.length !== 1) { throw new Error(); }
	  result = result[0];
	} else {
	  if (stack.length) { throw new Error(); }
	}

	if (opt_reviver) {
	  // Based on walk as implemented in http://www.json.org/json2.js
	  var walk = function (holder, key) {
		var value = holder[key];
		if (value && typeof value === 'object') {
		  var toDelete = null;
		  for (var k in value) {
			if (hop.call(value, k) && value !== holder) {
			  // Recurse to properties first.  This has the effect of causing
			  // the reviver to be called on the object graph depth-first.

			  // Since 'this' is bound to the holder of the property, the
			  // reviver can access sibling properties of k including ones
			  // that have not yet been revived.

			  // The value returned by the reviver is used in place of the
			  // current value of property k.
			  // If it returns undefined then the property is deleted.
			  var v = walk(value, k);
			  if (v !== void 0) {
				value[k] = v;
			  } else {
				// Deleting properties inside the loop has vaguely defined
				// semantics in ES3 and ES3.1.
				if (!toDelete) { toDelete = []; }
				toDelete.push(k);
			  }
			}
		  }
		  if (toDelete) {
			for (var i = toDelete.length; --i >= 0;) {
			  delete value[toDelete[i]];
			}
		  }
		}
		return opt_reviver.call(holder, key, value);
	  };
	  result = walk({ '': result }, '');
	}

	return result;
  };

  function JSONStringify(value) {
		var t = typeof (value);
		if (t != "object" || value === null) {
			// simple data type
			if (t == "string") value = '"'+value+'"';
			return String(value);
		} else {
			// recurse array or object
			var n, v, json = [], arr = (value && value.constructor == Array);
			for (n in value) {
				v = value[n]; t = typeof(v);
				if (t == "string") v = '"'+v+'"';
				else if (t == "object" && v !== null) v = JSONStringify(v);
				json.push((arr ? "" : '"' + n + '":') + String(v));
			}
			return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
		}
	}

  return {
  	parse: JSONParse,
  	stringify: JSONStringify
  };

})();





			var __KRANG6__ = (function (Global, JSON) {

	var URL_DIRNAME_REGEXP = /^(.*)\//;
	var FILE_TYPE_REGEXP = /.+\.([^\.]+)$/;
	var ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	var URL_PARSER_REGEXP = /^(?:([^:\/?\#]+):)?(?:\/\/([^\/?\#]*))?([^?\#]*)(?:\?([^\#]*))?(?:\#(.*))?/;

	function getbyte64(s, i) {
		var ch = s.charAt(i);
		var idx = ALPHA.indexOf(ch);
		if (idx === -1) throw ('illegal `' + ch + '` character');
		return idx;
	}

	function removeDotSegments(path) {
		var path = path.split('/');
		var isAbsolute = (path[0] === '');
		var result = [], fragment = '';
		if (isAbsolute) path.shift();
		while (path.length) {
			fragment = path.shift();
			if (fragment === '..') {
				result.pop();
			} else if (fragment !== '.') {
				result.push(fragment);
			}
		}
		if (isAbsolute) result.unshift('');
		if (fragment === '.' || fragment === '..') result.push('');
		return result.join('/');
	}

	function isUndefined(value) {
		return (value === undefined);
	}

	function isBoolean(value) {
		return (typeof(value) === 'boolean');
	}

	function isString(value) {
		return (typeof value === 'string');
	}

	function isArray(value) {
		return (value instanceof Array);
	}

	function isFunction(value) {
		return (value instanceof Function);
	}

	function isMap(value) {
		return (
			value instanceof Object &&
			!(value instanceof Function) &&
			!(value instanceof Array)
		);
	}

	function base64decode(value) {
		var result = [];
		var pads = 0, i, b10;
		var value = String(value);
		var length = value.length;

		if (!length) return value;
		if (length % 4) throw ('incorrect padding');

		if (value.charAt(length - 1) === '=') {
			pads = 1;
			if (value.charAt(length - 2) === '=') pads = 2;
			length -= 4;
		}

		for (i = 0; i < length; i += 4) {
			b10 = getbyte64(value, i) << 18;
			b10 |= getbyte64(value, i + 1) << 12;
			b10 |= getbyte64(value, i + 2) << 6;
			b10 |= getbyte64(value, i + 3);
			result.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 0xff, b10 & 0xff));
		}

		if (pads) {
			b10 = getbyte64(value, i) << 18;
			b10 |= getbyte64(value, i + 1) << 12;
			result.push(String.fromCharCode(b10 >> 16));
			if (pads === 1) {
				b10 |= getbyte64(value, i + 2) << 6;
				result.push(String.fromCharCode((b10 >> 8) & 0xff));
			}
		}

		return result.join('');
	}

	function hasOwnProperty(value, name) {
		return (value !== null &&
			value !== undefined && typeof name === 'string' &&
			Object.prototype.hasOwnProperty.call(value, name));
	}

	function object_clone(value) {
		if (isMap(value)) {
			var result = {};
			for (var key in value)
				result[key] = object_clone(value[key]);
			return result;
		} else if (isArray(value)) {
			var result = new Array(value.length);
			for (var c = 0; c < value.length; c++)
				result[c] = object_clone(value[c]);
			return result;
		} else return value;
	}

	function object_merge() {
		var c, key, value;
		var result = {}, object;
		var length = arguments.length;
		for (c = 0; c < length; c++) {
			if (!isMap(object = arguments[c])) continue;
			for (key in object) {
				if (!hasOwnProperty(object, key)) continue;
				if (isUndefined(value = object[key])) {
					if (hasOwnProperty(result, key))
						delete result[key];
				} else if (hasOwnProperty(result, key) &&
					isMap(result[key]) && isMap(value)) {
					result[key] = object_merge(result[key], value);
				} else if (isMap(value)) {
					result[key] = object_merge(value);
				} else result[key] = value;
			}
		}
		return result;
	}

	function mapAsync(collection, iterator, ret, thisArg) {
		if (!isFunction(ret)) ret = null;
		if (isUndefined(collection)) collection = [];
		else if (!isArray(collection)) collection = [collection];
		var length = collection.length, result = new Array(length);
		if (isFunction(iterator) && length) {
			var index, toLoad = length;
			for (index = 0; index < length; index++) {
				iterator.call(thisArg, collection[index], function(index) {
					return function(value) {
						result[index] = value;
						if (--toLoad) return;
						(ret && ret.call(thisArg, result));
					};
				}(index), index);
			}
		} else (ret && ret.call(thisArg, result));
	}

	function json_parse(value) {
		if (isUndefined(Global.JSON))
			return JSON.parse(value);
		else return Global.JSON.parse(value);
	}

	function json_stringify(value) {
		if (isUndefined(Global.JSON))
			return JSON.stringify(value);
		else return Global.JSON.stringify(value);
	}

	function string_trimLeft(value) {
		if (!isString(value)) return '';
		return value.replace(/^\s+/, '');
	}

	function string_trimRight(value) {
		if (!isString(value)) return '';
		return value.replace(/\s+$/, '');
	}

	function string_startsWith(value, search, ignoreCase) {
		if (!isString(value)) return false;
		if (!isString(search)) return false;
		var fragment = value.substr(0, search.length);
		if (ignoreCase) {
			search = search.toLowerCase();
			fragment = fragment.toLowerCase();
		}
		return (search === fragment);
	}

	function uri_parse(uri) {
		var result = uri.match(URL_PARSER_REGEXP);
		var scheme = (result[1] || '').toLowerCase();
		var authority = (result[2] || '').toLowerCase();
		var path = (result[3] || '');
		var fileName = (path.split('/').pop());
		var fileType = fileName.match(FILE_TYPE_REGEXP);
		fileType = (fileType && fileType[1] || '');
		if (scheme === 'http' && authority.slice(-3) === ':80')
			authority = authority.slice(0, -3);
		else if (scheme === 'https' && authority.slice(-4) === ':443')
			authority = authority.slice(0, -4);
		return {
			scheme: scheme, authority: authority,
			path: path, fileName: fileName, fileType: fileType,
			query: (result[4] || ''), fragment: (result[5] || '')
		};
	}

	function uri_parseData(dataURI) {
		var keyValue, result = {
			type: 'text/plain',
			data: '', encoding: '',
			params: {charset: 'US-ASCII'}
		};
		if (isString(dataURI) &&
			string_startsWith(dataURI, 'data:', true)) {
			keyValue = dataURI.substr(5).split(',');
			dataURI = keyValue.shift().split(';');
			result.data = keyValue.join(',');
			result.type = dataURI.shift();
			while (dataURI.length) {
				keyValue = dataURI.shift().split('=');
				if (isString(keyValue[1]))
					result.params[keyValue[0]] = keyValue[1];
				else result.encoding = keyValue[0];
			}
		}
		return result;
	}

	function uri_parseQuery(query) {
		var result = {};
		if (!isString(query)) return {};
		query.replace(new RegExp('([^?=&]+)(=([^&]*))?', 'g'),
			function($0, $1, $2, $3) { result[$1] = $3; });
		return result;
	}

	function uri_format(uri) {
		return ((uri.scheme ? uri.scheme + '://' : '') +
			(uri.authority ? uri.authority : '') +
			(uri.path ? uri.path : '') +
			(uri.query ? '?' + uri.query : '') +
			(uri.fragment ? '#' + uri.fragment : ''));
	}

	function uri_formatQuery(query) {
		var queryArr = [], key;
		if (!isMap(query)) return '';
		for (key in query) {
			if (!query.hasOwnProperty(key)) continue;
			queryArr.push(key + '=' + query[key]);
		}
		return queryArr.join('&');
	}

	function uri_resolve(uri, base) {
		var relUri = uri;
		var baseUri = base;
		if (isString(relUri)) relUri = uri_parse(relUri);
		if (isString(baseUri)) baseUri = uri_parse(baseUri);
		var res = '', ts = '';
		if (relUri.scheme) {
			res += (relUri.scheme + ':');
			if (ts = relUri.authority) res += ('//' + ts);
			if (ts = removeDotSegments(relUri.path)) res += ts;
			if (ts = relUri.query) res += ('?' + ts);
		} else {
			if (ts = baseUri.scheme) res += (ts + ':');
			if (ts = relUri.authority) {
				res += ('//' + ts);
				if (ts = removeDotSegments(relUri.path || '')) res += ts;
				if (ts = relUri.query) res += ('?' + ts);
			} else {
				if (ts = baseUri.authority) res += ('//' + ts);
				if (ts = relUri.path) {
					if (ts = removeDotSegments(ts.charAt(0) === '/' ? ts : (
						baseUri.authority && !baseUri.path ? '/' :
						(baseUri.path.match(URL_DIRNAME_REGEXP) || [''])[0]
					) + ts)) res += ts;
					if (ts = relUri.query) res += ('?' + ts);
				} else {
					if (ts = baseUri.path) res += ts;
					if ((ts = relUri.query) ||
						(ts = baseUri.query)) res += ('?' + ts);
				}
			}
		}
		if (ts = relUri.fragment) res += ('#' + ts);
		return res;
	}

	return {
		isUndefined: isUndefined,
		isBoolean: isBoolean,
		isString: isString,
		isArray: isArray,
		isFunction: isFunction,
		isMap: isMap,
		mapAsync: mapAsync,
		base64decode: base64decode,
		hasOwnProperty: hasOwnProperty,

		json: {
			parse: json_parse,
			stringify: json_stringify
		},

		object: {
			clone: object_clone,
			merge: object_merge
		},
		string: {
			trimLeft: string_trimLeft,
			trimRight: string_trimRight,
			startsWith: string_startsWith
		},
		uri: {
			parse: uri_parse,
			parseQuery: uri_parseQuery,
			format: uri_format,
			formatQuery: uri_formatQuery,
			resolve: uri_resolve,
			parseData: uri_parseData
		}
	};

})(__KRANG1__,__KRANG5__);





			var __KRANG2__ = {"uri": "MY_BASE_URI"};





			var __KRANG3__ = (function (Global) {

	var featureObj = {};

	if (typeof Global.window === 'object' &&
		typeof Global.window.navigator === 'object' &&
		typeof Global.window.navigator.userAgent === 'string') {
		var versionStr, userAgent = Global.window.navigator.userAgent;
		if (versionStr = userAgent.match(/AppleWebKit\/([\d.]+)/)) {
			featureObj['webkit'] = {'version': parseFloat(versionStr[1])};
			if (versionStr = userAgent.match(/Chrome\/([\d.]+)/))
				featureObj['chrome'] = {'version': parseFloat(versionStr[1])};
			else if (versionStr = userAgent.match(/Version\/([\d.]+)/))
				featureObj['safari'] = {'version': parseFloat(versionStr[1])};
		} else if (versionStr = userAgent.match(/Gecko\/([\d.]+)/)) {
			featureObj['gecko'] = {'version': parseFloat(versionStr[1])};
			if (versionStr = userAgent.match(/Firefox\/([\d.]+)/))
				featureObj['firefox'] = {'version': parseFloat(versionStr[1])};
		} else if (versionStr = userAgent.match(/MSIE\s([\d.]+)/)) {
			featureObj['ie'] = {'version': parseFloat(versionStr[1])};
		} else if (versionStr = userAgent.match(/Opera\/([\d.]+)/)) {
			featureObj['opera'] = {'version': parseFloat(versionStr[1])};
			if (versionStr = userAgent.match(/Version\/([\d.]+)/))
				featureObj['opera'] = {'version': parseFloat(versionStr[1])};
		}
		featureObj = {'browser': featureObj};
	}

	else if (typeof Global.process === 'object' &&
		typeof Global.process.version === 'string') {
		var versionStr = Global.process.version;
		versionStr = versionStr.match(/\d+\.\d+[\.\d+]*/);
		featureObj['nodejs'] = {'version': parseFloat(versionStr[0])};
	}

	else if (Global.Packages instanceof Object && typeof Global.Packages
		.org.mozilla.javascript.Context.getCurrentContext) {
		var versionStr = Packages.org.mozilla.javascript.Context;
		versionStr = versionStr.getCurrentContext().getImplementationVersion();
		versionStr = String(versionStr).match(/\d+\.\d+[\.\d+]*/);
		featureObj['rhino'] = {'version': parseFloat(versionStr[0])};
	}

	return featureObj;

})(__KRANG1__);





			var __KRANG4__ = (function (Global, Module, Environment) {

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

})(__KRANG1__,__KRANG2__,__KRANG3__);





			var __KRANG7__ = (function (Utils) {

	var RES_IDLE = 0;
	var RES_LOADING = 1;
	var RES_LOADED = 2;
	var RESOURCES = {};

	function getResource(resourceID) {
		if (!Utils.isString(resourceID)) resourceID = '';
		return (
			RESOURCES.hasOwnProperty(resourceID)
			? RESOURCES[resourceID]
			: RESOURCES[resourceID] = {
				uses: {},
				views: {}
			}
		);
	}

	function getView(resourceID, viewID) {
		var resource = getResource(resourceID);
		if (!Utils.isString(viewID)) viewID = '';
		return (
			resource.views.hasOwnProperty(viewID)
			? resource.views[viewID]
			: resource.views[viewID] = {
				status: RES_IDLE,
				waiting: []
			}
		);
	}

	function isCircular(resID1, resID2) {
		if (resID1 === resID2) return true;
		for (var resID in RESOURCES[resID1].uses) {
			if (!isCircular(resID, resID2)) continue;
			return true;
		}
	}

	function loadResource(resource, resourceData) {
		resource.data = resourceData;
		resource.status = RES_LOADED;
		var waiting = resource.waiting;
		while (waiting.length) {
			waiting.shift()(
				resourceData
			);
		}
	}

	return function() {

		var resourceID, viewID;
		var loader, listener, parentID;

		var args = Array.prototype.slice.call(arguments);
		if (Utils.isString(args[0])) resourceID = args.shift();
		if (Utils.isString(args[0])) viewID = args.shift();
		if (Utils.isFunction(args[0])) listener = args.shift();
		if (Utils.isFunction(args[0])) loader = args.shift();
		if (Utils.isString(args[0])) parentID = args.shift();

		var resource = getView(resourceID, viewID);

		if (resource.status === RES_LOADED) {
			if (!listener) return resource.data;
			else return listener(resource.data);
		}

		if (Utils.isString(parentID)) {
			getResource(parentID).uses[resourceID] = true;
			if (isCircular(resourceID, parentID)) {
				throw parentID + ' refers back to ' + resourceID;
			}
		}

		if (listener) resource.waiting.push(listener);
		if (resource.status !== RES_LOADING) {
			resource.status = RES_LOADING;
			if (!loader) loadResource(resource);
			else loader(resourceID, function(resourceData) {
				loadResource(resource, resourceData);
			}, parentID);
		}
	};

})(__KRANG6__);





			var __KRANG11__ = (function (Utils, Krang) {

	var URL, Schemes;
	var initialized = false;

	function initialize() {

		if (initialized) return;
		initialized = true;

		URL = require('url');
		Schemes = {
			'file': require('fs'),
			'http': require('http'),
			'https': require('https')
		};
	}

	function Driver(requestURI, success, fail) {

		initialize();

		var requestObj = Utils.uri.parse(requestURI);
		var requestScheme = (requestObj.scheme || 'file');

		if (requestScheme === 'http' || requestScheme === 'https') {

			Schemes[requestScheme].request({

				method: 'GET',
				path: [
					requestObj.path,
					requestObj.query
				].join('?'),
				hostname: requestObj.authority

			}, function(response) {

				if (response.statusCode > 300 &&
					response.statusCode < 400 &&
					response.headers.location) {

					var toURI = URL.parse(response.headers.location);
					if (!toURI.port) toURI.port = requestObj.port;
					if (!toURI.host) toURI.host = requestObj.host;
					if (!toURI.hostname) toURI.hostname = requestObj.hostname;
					if (!toURI.protocol) toURI.protocol = requestObj.protocol;
					return doHTTPRequest(toURI, success, fail);

				}

				var data = '';
				response.on('end', function() {
					try {

						var hasDefinition = false;
						var runner = new Function('define, require, module', data);
						runner.currentScript = requestURI;

						runner(function() {
							hasDefinition = true;
							Krang.define(requestURI, arguments, success);
						}, require, module);

						if (!hasDefinition) {
							throw new Krang.MissingDefinition(requestURI);
						}

					} catch (exception) {
						fail(exception);
					}
				}).on('data', function(chunk) { data += chunk; });

			}).on('error', fail).end();

		} else if (requestScheme === 'file') {

			Schemes[requestScheme].readFile(
				requestObj.path, function(error, data) {
					if (error) return fail(error);
					try {

						new Function('define, require, module', data.toString())(function() {
							Krang.define(requestURI, arguments, success);
						}, require, module);

					} catch (exception) {
						fail(exception);
					}
				}
			);

		} else fail('unsupported scheme:' + requestScheme);
	}

	return Driver;
})(__KRANG6__,__KRANG4__);





			var __KRANG10__ = (function (Global, Utils, Krang) {

	var defineMap = {};

	Global.define = function() {
		var currentScript = Krang.getCurrentScript();
		if (!currentScript) return false;
		var scriptURI = currentScript.src;
		if (!defineMap.hasOwnProperty(scriptURI)) return false;
		var callback = defineMap[scriptURI];
		callback.called = true;
		Krang.define(scriptURI, arguments, callback);
		return true;
	};


	var XMLHttpFactories = [
		function() { return new XMLHttpRequest() },
		function() { return new ActiveXObject('Msxml2.XMLHTTP') },
		function() { return new ActiveXObject('Msxml3.XMLHTTP') },
		function() { return new ActiveXObject('Microsoft.XMLHTTP') }
	];

	function createXMLHTTPObject() {
		var xmlhttp = false;
		for (var c = 0; c < XMLHttpFactories.length; c++) {
			try {
				xmlhttp = XMLHttpFactories[c]();
				break;
			} catch (exception) {}
		}
		return xmlhttp;
	}

	function isSameOrigin(uri1, uri2) {
		var uri1 = Utils.uri.parse(uri1);
		var uri2 = Utils.uri.parse(uri2);
		return (uri1.scheme == uri2.scheme &&
			uri1.authority === uri2.authority);
	}

	function doScriptRequest(requestURI, success, fail) {
		var sElement = document.createElement('script');
		sElement.setAttribute('type', 'text/javascript');
		sElement.setAttribute('async', 'async');
		sElement.setAttribute('src', requestURI);
		defineMap[requestURI] = success;
		sElement.onload = function() {
			if (!defineMap[this.src].called) {
				throw new Krang.MissingDefinition(this.src);
			}
		};
		document.getElementsByTagName('head')[0].appendChild(sElement);
	}

	function doXMLHTTPRequest(requestURI, success, fail) {
		var request = createXMLHTTPObject();
		if (!request) return fail('could not instantiate XMLHttpRequest');
		try {
			request.open('GET', requestURI, true);
			request.onreadystatechange = function() {
				if (request.readyState !== 4) return;
				var status = request.status;
				if (status !== 200) return fail('not found');
				try {
					var hasDefinition = false;
					var runner = new Function('define', request.responseText);
					runner.currentScript = requestURI;
					runner(function() {
						hasDefinition = true;
						Krang.define(requestURI, arguments, success);
					});
					if (!hasDefinition) {
						throw new Krang.MissingDefinition(requestURI);
					}
				} catch (exception) {
					fail(exception);
				}
			};
			request.send(null);
		} catch (exception) {
			fail(exception);
		}
	}

	return function(requestURI, success, fail) {
		if (!isSameOrigin(window.location.href, requestURI))
			doScriptRequest(requestURI, success, fail);
		else doXMLHTTPRequest(requestURI, success, fail);
	};

})(__KRANG1__,__KRANG6__,__KRANG4__);





			var __KRANG12__ = (function (Utils, Environment, NodeDriver, BrowserDriver) {

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

})(__KRANG6__,__KRANG3__,__KRANG11__,__KRANG10__);





			var __KRANG8__ = (function () {

	var T_EOF = -1,
	T_FRAGMENT = 0,
	T_KIND_IGNORE = 1,
	T_KIND_TOKEN = 2;

	var Tokenizer = function() {

		var lastTokenId = 0;
		var tokenStrings = [];
		var tokenDefinitions = [[], []];

		var currentToken;
		var inputString, inputStringLength;
		var textData, textLength, tokenInfo;
		var match, matchLength, gIndex, matchIndex;
		var tokenOffset, tokenBuffer, tokenBufferLength;

		function processToken() {
			if (tokenOffset !== inputStringLength) {
				if (match = tokenDefinitions[0].exec(inputString)) {
					matchLength = match.length;
					for (gIndex = 1; gIndex < matchLength; gIndex++) {
						textData = match[gIndex];
						if (!textData) continue;
						matchIndex = match.index;
						if (textLength = matchIndex - tokenOffset) {
							tokenBufferLength = tokenBuffer.push({
								type: T_FRAGMENT,
								pos: tokenOffset,
								value: inputString.substr(
									tokenOffset, textLength
								)
							});
							tokenOffset += textLength;
						}
						textLength = textData.length;
						tokenOffset = (matchIndex + textLength);
						tokenInfo = tokenDefinitions[1][gIndex - 1];
						switch (tokenInfo[0]) {
							case T_KIND_TOKEN:
								tokenBufferLength = tokenBuffer.push({
									type: tokenInfo[1],
									pos: matchIndex,
									value: textData
								});
								break;
							default: processToken();
						}
						break;
					}
				} else if (textLength = inputStringLength - tokenOffset) {
					tokenBufferLength = tokenBuffer.push({
						type: T_FRAGMENT,
						pos: tokenOffset,
						value: inputString.substr(
							tokenOffset, textLength
						)
					});
					tokenOffset += textLength;
				}
			} else {
				tokenBufferLength = tokenBuffer.push({
					type: T_EOF,
					value: 'EOF',
					pos: inputStringLength
				});
			}
		}

		function nextToken() {
			if (!tokenBufferLength) processToken();
			tokenBufferLength--;
			currentToken = tokenBuffer.shift();
		}

		function addTokens(tokens, kind) {
			if (typeof(tokens) !== 'object') tokens = [tokens];
			lastTokenId++;
			tokenStrings.push('(' + tokens.join('|') + ')');
			tokenDefinitions[1].push([kind, lastTokenId]);
			return lastTokenId;
		}

		this.addToken = function(tokens) {
			return addTokens(tokens, T_KIND_TOKEN);
		};

		this.addIgnore = function(ignores) {
			return addTokens(ignores, T_KIND_IGNORE);
		};

		this.tokenize = function(input) {
			tokenOffset = 0;
			tokenBuffer = [];
			tokenBufferLength = 0;
			currentToken = null;
			inputString = input;
			inputStringLength = input.length;
			tokenDefinitions[0] = tokenStrings.join('|');
			tokenDefinitions[0] = new RegExp(tokenDefinitions[0], 'g');
			nextToken();
		};

		this.getFragment = function() {
			return (
				currentToken.value ?
				currentToken.value :
				inputString.substr(
					currentToken.pos,
					currentToken.len
				)
			);
		};

		this.test = function(tokenType) {
			return (currentToken.type === tokenType);
		};

		this.next = function(tokenType) {
			if (tokenType === undefined ||
				this.test(tokenType)) {
				var token = currentToken;
				return (nextToken(), token);
			}
		};

	};

	Tokenizer.T_EOF = T_EOF;
	Tokenizer.T_FRAGMENT = T_FRAGMENT;

	return Tokenizer;
})();





			var __KRANG9__ = (function (Tokenizer, Utils) {

	var tokenizer, fileName, context;

	var T_OR, T_AND, T_NOT, T_DOT, T_LPAREN, T_RPAREN,
		T_EQUAL, T_NOT_EQUAL, T_LESS_OR_EQUAL, T_GREATER_OR_EQUAL,
		T_LESS_THAN, T_GREATER_THAN, T_NUMBER, T_STRING, T_ID;

	var P_NUMBER = 1, P_STRING = 2, P_SELECTOR = 3, P_NOT = 4,
		P_LESS_THAN = 5, P_GREATER_THAN = 6, P_LESS_OR_EQUAL = 7,
		P_GREATER_OR_EQUAL = 8, P_EQUAL = 9, P_NOT_EQUAL = 10,
		P_AND = 11, P_OR = 12;

	function initialize() {
		if (tokenizer) return;
		tokenizer = new Tokenizer();
		T_OR = tokenizer.addToken('or\\b');
		T_AND = tokenizer.addToken('and\\b');
		T_NOT = tokenizer.addToken('not\\b');
		T_DOT = tokenizer.addToken('\\.');
		T_LPAREN = tokenizer.addToken('\\(');
		T_RPAREN = tokenizer.addToken('\\)');
		T_EQUAL = tokenizer.addToken('=');
		T_NOT_EQUAL = tokenizer.addToken('<>');
		T_LESS_OR_EQUAL = tokenizer.addToken('<=');
		T_GREATER_OR_EQUAL = tokenizer.addToken('>=');
		T_LESS_THAN = tokenizer.addToken('<');
		T_GREATER_THAN = tokenizer.addToken('>');
		T_NUMBER = tokenizer.addToken(['[0-9]*\\.[0-9]+', '[0-9]+']);
		T_STRING = tokenizer.addToken([
			'\'(?:[^\'\\\\]|\\\\.)*\'',
			'\"(?:[^\"\\\\]|\\\\.)*\"'
		]);
		T_ID = tokenizer.addToken('[a-zA-Z_$][a-zA-Z0-9_$]*');
		tokenizer.addIgnore('[\x09\x0A\x0D\x20]+');
	}

	function parseError(expected, found) {
		var expected = (expected || 'EOF');
		var found = (found || tokenizer.getFragment());
		var errorMessage = ('parse error: "' + expected +
			'" expected, but "' + found + '" found ' +
			'(' + fileName + ')');
		return {
			fileName: fileName,
			expected: expected, found: found,
			toString: function() { return errorMessage; }
		};
	}

	function parseSimpleExpression() {
		if (tokenizer.test(T_NUMBER)) {
			var value = tokenizer.next();
			value = parseFloat(value.value, 10);
			return [P_NUMBER, value];
		} else if (tokenizer.test(T_STRING)) {
			var value = tokenizer.next();
			return [P_STRING, value.value.slice(1, -1)];
		} else if (tokenizer.test(T_ID)) {
			var value = tokenizer.next();
			return [P_SELECTOR, [value.value]];
		} else if (tokenizer.next(T_LPAREN)) {
			if (tokenizer.next(T_RPAREN))
				throw new parseError('expression', '()');
			try {
				var value = parseExpression();
			} finally {
				if (!tokenizer.next(T_RPAREN))
					throw new parseError(')');
			}
			return value;
		}
		else throw new parseError('expression');
	}

	function parsePrimaryExpression() {
		var left = parseSimpleExpression();
		if (!tokenizer.test(T_DOT)) return left;
		if (left[0] !== P_SELECTOR)
			throw new parseError();
		while (tokenizer.next(T_DOT)) {
			if (!tokenizer.test(T_ID))
				throw new parseError('identifier');
			left[1].push(tokenizer.next().value);
		}
		return left;
	}

	function parseUnaryExpression() {
		return (tokenizer.next(T_NOT) && [
			P_NOT, parseUnaryExpression()
		] || parsePrimaryExpression());
	}

	function parseRelExpression() {
		var left = parseUnaryExpression();
		return (tokenizer.next(T_LESS_OR_EQUAL) && [
			P_LESS_OR_EQUAL, left, parseUnaryExpression()
		] || tokenizer.next(T_LESS_THAN) && [
			P_LESS_THAN, left, parseUnaryExpression()
		] || tokenizer.next(T_GREATER_OR_EQUAL) && [
			P_GREATER_OR_EQUAL, left, parseUnaryExpression()
		] || tokenizer.next(T_GREATER_THAN) && [
			P_GREATER_THAN, left, parseUnaryExpression()
		] || left);
	}

	function parseEqExpression() {
		var left = parseRelExpression();
		while (tokenizer.next(T_EQUAL) && (
			left = [P_EQUAL, left, parseRelExpression()]
		) || tokenizer.next(T_NOT_EQUAL) && (
			left = [P_NOT_EQUAL, left, parseRelExpression()]
		)){};
		return left;
	}

	function parseAndExpression() {
		var left = parseEqExpression();
		while (tokenizer.next(T_AND) && (
			left = [P_AND, left, parseEqExpression()]
		)){};
		return left;
	}

	function parseExpression() {
		var left = parseAndExpression();
		while (tokenizer.next(T_OR) && (
			left = [P_OR, left, parseAndExpression()]
		)){};
		return left;
	}

	function parseString() {
		var result = parseExpression();
		if (!tokenizer.test(Tokenizer.T_EOF))
			throw new parseError('EOF');
		return result;
	}

	function evalNode(node) {
		var type = node[0];
		switch (type) {
			case P_NUMBER:
			case P_STRING:
				return node[1];
			case P_OR:
			case P_NOT:
			case P_AND:
				var left = toBoolean(evalNode(node[1]));
				if (type === P_NOT) return (!left);
				if (left && type === P_OR) return true;
				var right = toBoolean(evalNode(node[2]));
				if (type === P_AND) return (left && right);
				if (type === P_OR) return (left || right);
			case P_EQUAL:
			case P_NOT_EQUAL:
			case P_LESS_THAN:
			case P_GREATER_THAN:
			case P_LESS_OR_EQUAL:
			case P_GREATER_OR_EQUAL:
				var left = evalNode(node[1]);
				var right = evalNode(node[2]);
				if (type === P_EQUAL) return (left === right);
				if (type === P_NOT_EQUAL) return (left !== right);
				if (type === P_LESS_THAN) return (left < right);
				if (type === P_GREATER_THAN) return (left > right);
				if (type === P_LESS_OR_EQUAL) return (left <= right);
				if (type === P_GREATER_OR_EQUAL) return (left >= right);
			case P_SELECTOR:
				var c, fragment;
				var result = context, selector = node[1];
				for (c = 0; c < selector.length; c++) {
					fragment = selector[c];
					if (!Utils.hasOwnProperty(result, fragment)) {
						result = undefined;
						break;
					} else result = result[fragment];
				}
				return result;
		}
	}

	function toBoolean(value) {
		if (value === undefined) return false;
		if (value === null) return false;
		if (value === true) return true;
		if (value === false) return false;
		if (typeof(value) === 'number') return (value !== 0);
		if (typeof(value) === 'string') return (value.length !== 0);
		if (value instanceof Array) return (value.length !== 0);
		if (value instanceof Function) return true;
		if (value instanceof Object) return true;
	}

	function Parser(input, baseURI) {
		initialize();
		fileName = baseURI;
		tokenizer.tokenize(input);
		return parseString();
	}

	function Evaluator(ctx) {
		return function(input, baseURI) {
			context = ctx;
			var expressionAST = Parser(input, baseURI);
			var expressionResult = evalNode(expressionAST);
			return toBoolean(expressionResult);
		};
	}

	return Evaluator;
})(__KRANG8__,__KRANG6__);





			var __KRANG13__ = (function (Utils, Krang, Environment,
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

})(__KRANG6__,__KRANG4__,__KRANG3__,__KRANG7__,__KRANG12__,__KRANG9__);





			var __KRANG14__ = (function (Global, Krang, Utils, DependencyParser, ResourceLoader) {

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

})(__KRANG1__,__KRANG4__,__KRANG6__,__KRANG13__,__KRANG7__);





			var __KRANG15__ = (function (Krang, Utils, ResourceLoader, DependencyEvaluator) {

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

})(__KRANG4__,__KRANG6__,__KRANG7__,__KRANG14__);





			var krang = (function (Utils, Krang, Environment,
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

})(__KRANG6__,__KRANG4__,__KRANG3__,__KRANG13__,__KRANG15__,__KRANG14__);



	if (typeof this.process === 'object' &&
		typeof this.process.version === 'string' &&
		typeof module === 'object' &&
		typeof module.exports === 'object') {
		module.exports = krang;
	} else if (typeof global.krang !== 'function' ||
		!global.define(krang)) {
		global["krang"] = krang;
	}

})(function() { return this; }.call(null));