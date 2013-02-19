require('./krang.js').require('src/main', function(krang) {

	krang({
		cache: false
	}).require([
		// 'https://raw.github.com/MegafonWebLab/histone-javascript/master/src/Histone.js'
		'../histone-javascript.git/src/Histone'
	], function(bar, standalone2) {
		bar('{{2 * 2}}').render(function(result) {
			console.info(result);
		});
	});

});
