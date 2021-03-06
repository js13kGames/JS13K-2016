/* eslint-env node */
'use strict';

const gulp = require('gulp');
const $ = require('gulp-load-plugins')();

const browserSync = require('browser-sync').create();
const del = require('del');
const rollup = require('rollup').rollup;
const runSequence = require('run-sequence');
const string = require('rollup-plugin-string');

let production = false;

gulp.task('browser-sync', () => {
  return browserSync.init({
    browser: [],
    server: {
      baseDir: './dist',
    },
  });
});

gulp.task('clean', () => del(['build', 'dist']));

gulp.task('rollup', () => {
  return rollup({
    entry: 'src/index.js',
    plugins: [
      string({
        include: '**/*.glsl',
      }),
    ],
  })
    .then(bundle => bundle.write({
      dest: 'build/bundle.js',
      format: 'iife',
    }));
});

gulp.task('js', ['rollup'], () => {
  return gulp.src('build/bundle.js')
    .pipe($.if(production, $.uglify()))
    .pipe(gulp.dest('dist'))
    .pipe(browserSync.stream());
});

gulp.task('html', () => {
  return gulp.src('./index.html')
    .pipe($.if(production, $.htmlmin({
      collapseWhitespace: true,
      removeAttributeQuotes: true,
      removeComments: true,
      minifyCSS: true,
    })))
    .pipe(gulp.dest('dist'))
    .pipe(browserSync.stream());
});

gulp.task('watch', () => {
  gulp.watch(['src/**/*.js'], ['js']);
  gulp.watch(['./index.html'], ['html']);
});

gulp.task('default', ['clean'], cb => {
  return runSequence(
    ['html', 'js'],
    ['browser-sync', 'watch'],
    cb
  );
});

gulp.task('build', ['clean'], cb => {
  production = true;
  return runSequence(
    ['html', 'js'],
    cb
  );
});

gulp.task('compress', () => {
  return gulp.src('dist/**/*')
    .pipe($.zip('build.zip'))
    .pipe($.size())
    .pipe($.size({ pretty: false }))
    .pipe(gulp.dest('build'));
});

gulp.task('dist', cb => runSequence('build', 'compress', cb));
