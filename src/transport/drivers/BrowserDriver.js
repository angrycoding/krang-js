define([
	'!global',
	'../../Utils',
	'../../Krang'
], function(Global, Utils, Krang) {

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

});