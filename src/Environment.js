define(['!global'], function(Global) {

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

});