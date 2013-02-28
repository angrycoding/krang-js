define(['!global', 'JSON'], function(Global, JSON) {

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

});