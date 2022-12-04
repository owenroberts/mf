const { src, dest, watch, series, parallel, task } = require('gulp');
require('dotenv').config()

const doodoo = process.env.USE_DOODOO ? require('./doodoo/gulpfile') : null;
const lines = process.env.USE_LINES ? require('./lines/gulpfile') : null;
const textTools = process.env.USE_TEXT_TOOLS ? require('./text_tools/gulpfile') : null;


const replace = require('gulp-replace');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const npmDist = require('gulp-npm-dist');
const iife = require('gulp-iife');
const logger = require('node-color-log');

function browserSyncTask() {
	return browserSync.init({
		port: 8001,
		server: {
			baseDir: './',
		}
	});
}

function logError(err) {
	logger
		.color('red')
		.log('* gulp-terser error', err.message, err.filename, err.line, err.col, err.pos);
}

function jsTask() {
	return src('./src/**/*')
		.pipe(sourcemaps.init())
		.pipe(concat('tv.min.js'))
		.pipe(iife())
		.pipe(terser().on('error', logError))
		.pipe(sourcemaps.write('./src_maps'))
		.pipe(dest('./build'))
		.on('error', function handleError() {
			this.emit('end'); // Recover from errors
		})
		.pipe(browserSync.stream());
}

function libTask() {
	return src(npmDist(), { base: './node_modules' })
		.pipe(dest('./build/lib'));
}

function doodooCopy() {
	if (!doodoo) return;
	return src([
			'./doodoo/build/doodoo.min.js',
			'./doodoo/build/src_maps/doodoo.min.js.map',
		], { base: './doodoo/build/' })
		.pipe(dest('./build'))
		.pipe(browserSync.stream());
}

function linesCopy() {
	if (!lines) return;
	return src([
			'./lines/build/lines.min.js', 
			'./lines/build/src_maps/lines.min.js.map',
			'./lines/build/game.min.js',
			'./lines/build/src_maps/game.min.js.map',
			'./lines/build/lib/**/*',
		], { base: './lines/build/' })
		.pipe(dest('./build'))
		.pipe(browserSync.stream());
}

function textToolsCopy() {
	if (!textTools) return;
	return src([
			'./text_tools/build/text_tools.min.js',
			'./text_tools/build/src_maps/text_tools.min.js.map',
		], { base: './text_tools/build/' })
		.pipe(dest('./build'))
		.pipe(browserSync.stream());
}

function webBuild() {
	return src([
			'./build/*.js',
			'./public/**/*',
			'./lib/**/*.js',
			'./lines/drawings/*',
			'./doodoo/samples/*',
			'index.html',
		], { base: './' })
		.pipe(dest('./web'));
}

function watchTask(){
	watch('src/**/*.js', series(jsTask));
	if (doodoo) {
		watch(['./doodoo/src/*.js', './doodoo/composer/src/**/*.js'], series(doodoo.exportTask, doodooCopy));
	}
	if (lines) {
		watch([
			'./lines/src/*.js', 
			'./lines/animate/src/*.js',
			'./lines/game/src/*.js',
		], 
		series(lines.exportTask, linesCopy));
	}

	if (textTools) {
		watch(textTools.files, series(textTools.exportTask, textToolsCopy));
	}
}

function cacheBustTask(){
	var cbString = new Date().getTime();
	return src(['index.html'])
		.pipe(replace(/cb=\d+/g, 'cb=' + cbString))
		.pipe(dest('.'));
}

task('js', jsTask);
task('watch', parallel(cacheBustTask, browserSyncTask, watchTask));
task('default', parallel('watch'));
task('web', webBuild);

const libTasks = [libTask];
if (lines) libTasks.push(lines.exportTask, linesCopy);
if (doodoo) libTasks.push(doodoo.exportTask, doodooCopy);
if (textTools) libTasks.push(textTools.exportTask, textToolsCopy);

task('lib', series(...libTasks));
task('build', series(...[...libTasks, jsTask]));
if (textTools) {
	task('copyTextData', series(function copyData() {
		return textTools.copyData('./public/grammars/');
	}));
}