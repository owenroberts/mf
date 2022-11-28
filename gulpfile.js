const { src, dest, watch, series, parallel, task } = require('gulp');
require('dotenv').config()

const doodoo = process.env.USE_DOODOO ? require('./doodoo/gulpfile') : null;
const lines = process.env.USE_LINES ? require('./lines/gulpfile') : null;

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
		])
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

function watchTask(){
	watch('src/**/*.js', series(jsTask));
	if (doodoo) {
		watch(['./doodoo/src/*.js'], series(doodoo.exportTask, doodooCopy));
	}
	if (lines) {
		watch([
			'./lines/src/*.js', 
			'./lines/animate/src/*.js',
			'./lines/game/src/*.js',
		], 
		series(lines.exportTask, linesCopy));
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

const libTasks = [libTask];
if (lines) libTasks.push(lines.exportTask, linesCopy);
if (doodoo) libTasks.push(doodoo.exportTask, doodooCopy);

task('lib', series(...libTasks));
task('build', series(...[...libTasks, jsTask]));