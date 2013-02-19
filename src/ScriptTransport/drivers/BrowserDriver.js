define([
	'!global',
	'../../Utils',
	'../../Krang'
], function(Global, Utils, Krang) {

	var scripts, defineMap = {};

	if (Global.document && Global.document.getElementsByTagName)
		scripts = document.getElementsByTagName('script');

	Global.define = function() {
		if (Global.document && Global.document.currentScript) {
			var scriptURI = Global.document.currentScript.src;
			Krang.define(scriptURI, arguments, defineMap[scriptURI]);
		} else try { throw new Error(); } catch (exception) {
			if (exception.stack) {
				var scriptURI = exception.stack;
				if (scriptURI.indexOf('@') === -1) {
					scriptURI = scriptURI.split('\n').pop();
					scriptURI = scriptURI.split(' ').pop();
				} else scriptURI = scriptURI.split('@').pop();
				scriptURI = scriptURI.split(/(\:\d+)+\s*$/).shift();
				Krang.define(scriptURI, arguments, defineMap[scriptURI]);
			} else for (var c = 0; c < scripts.length; c++) {
				if (scripts[c].readyState === 'interactive') {
					var scriptURI = scripts[c].src;
					Krang.define(scriptURI, arguments, defineMap[scriptURI]);
					break;
				}
			}
		}
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

					new Function('define', request.responseText)(function() {
						Krang.define(requestURI, arguments, success);
					});

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

});