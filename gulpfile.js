var path = require('path');
var del = require('del');
var gulp = require('gulp');
var eslint = require('gulp-eslint');
var excludeGitignore = require('gulp-exclude-gitignore');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var plumber = require('gulp-plumber');
var coveralls = require('gulp-coveralls');
var babel = require('gulp-babel');

gulp.task('static', function() {
  return gulp.src('**/*.js')
    .pipe(excludeGitignore())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('pre-test', [ 'compile' ], function() {
  return gulp.src([ 'dist/lib/**/*.js', 'dist/generators/*/index.js' ])
    .pipe(babel())
    .pipe(istanbul({includeUntested: true}))
    .pipe(istanbul.hookRequire());
});

gulp.task('test', [ 'pre-test' ], function() {
  gulp.src('test/**/*.js')
    .pipe(babel())
    .pipe(plumber())
    .pipe(mocha({reporter: 'spec'}))
    .on('error', function() {})
    .pipe(istanbul.writeReports());
});

gulp.task('coveralls', [ 'test' ], function() {
  if (!process.env.CI) {
    return;
  }
  return gulp.src(path.join(__dirname, 'coverage/lcov.info'))
    .pipe(coveralls());
});

gulp.task('babel', [ 'clean' ], function() {
  return gulp.src([ 'lib/**/*.js', '!lib/cli/blueprints/*/files/**/*' ])
    .pipe(babel())
    .pipe(gulp.dest('dist/lib'));
});

gulp.task('blueprints', [ 'clean' ], function() {
  return gulp.src('lib/cli/blueprints/*/files/**/*', { dot: true })
    .pipe(gulp.dest('dist/lib/cli/blueprints'));
});

gulp.task('test-server', [ 'test' ], function() {
  gulp.watch([ 'test/**/*.js', 'lib/**/*.js' ], [ 'test' ]);
});

gulp.task('compile', [ 'clean', 'babel', 'blueprints' ], function() {
  gulp.watch([ 'lib/**/*.js' ], [ 'clean', 'babel', 'blueprints' ]);
});

gulp.task('clean', function() {
  return del([ 'dist/**/*' ]);
});

gulp.task('prepublish', [ 'clean', 'babel', 'blueprints' ]);
gulp.task('default', [ 'static', 'test', 'coveralls' ]);
