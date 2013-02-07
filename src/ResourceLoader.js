define(['Utils'], function(Utils) {

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

});