var FileSystem = require('fs');
// var UglifyJS = require('uglify-js');
var Bootstrapper = require('./bootstrap.js');

Bootstrapper.require([
	'../src/main.js',
	'https://raw.github.com/MegafonWebLab/histone-javascript/master/src/Histone'
], function(TargetKrang, Histone) {

	console.info('-------------------------------------------------------');
	console.info('BOOTSTRAPPING...');
	console.info('bootstrapper version:', Bootstrapper.version);
	console.info('target version:', TargetKrang.version);
	console.info('-------------------------------------------------------');

	var targetFile = ('./krang.js');
	FileSystem.readFile('./bootstrap/bootstrap.tpl', function(error, tpl) {
		var tpl = Histone(String(tpl));
		Bootstrapper.build('../src/main.js', function(ResultKrang) {
			tpl.render(function(ResultKrang) {
				FileSystem.writeFile(targetFile, ResultKrang, function() {
					// console.info('compressing', targetFile);
					// var result = UglifyJS.minify(targetFile).code;
					// FileSystem.writeFile(targetFile, result, function() {
						console.info('done', targetFile);
					// });
				});
			}, {module: ResultKrang, alias: 'krang'});

		});
	});
});