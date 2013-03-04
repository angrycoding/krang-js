var FileSystem = require('fs');
var UglifyJS = require('uglify-js');
var Bootstrapper = require('krang-js');

Bootstrapper({
	debug: true
}).require([
	'../src/Main.js',
	'https://raw.github.com/MegafonWebLab/histone-javascript/master/src/Histone!build.tpl'
], function(SourceKrang, BuildTpl) {

	console.info('-------------------------------------------------------');
	console.info('BOOTSTRAPPING...');
	console.info('bootstrapper version:', Bootstrapper.version);
	console.info('target version:', SourceKrang.version);
	console.info('-------------------------------------------------------');

	var targetFile = ('./krang.js');
	Bootstrapper.build('../src/Main.js', function(ResultKrang) {
		BuildTpl.render(function(ResultKrang) {
			FileSystem.writeFile(targetFile, ResultKrang, function() {
				console.info('compressing', targetFile);
				var result = UglifyJS.minify(targetFile).code;
				FileSystem.writeFile(targetFile, result, function() {
					console.info('done', targetFile);
				});
			});
		}, {module: ResultKrang, alias: 'krang'});
	});
});