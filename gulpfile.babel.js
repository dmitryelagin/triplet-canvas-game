import gulp from 'gulp';
import sourcemaps from 'gulp-sourcemaps';
import babel from 'gulp-babel';
import replace from 'gulp-replace';
import inject from 'gulp-inject-string';
import del from 'del';

const dir = { base: 'src', dest: 'build', app: 'app', main: 'js' };

gulp.task('buildPages', () => (
  gulp.src(`${dir.base}/**/*.html`)
      .pipe(sourcemaps.init())
      .pipe(inject.before(
          '<script', '<script src="js/lib/polyfill.js"></script>\n'))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(dir.dest))));

gulp.task('buildScripts', () => (
  gulp.src([`${dir.base}/**/${dir.main}/*.js`,
            `${dir.base}/**/${dir.main}/${dir.app}/*.js`])
      .pipe(sourcemaps.init())
      .pipe(replace(/(importScripts\()/, '$1`${baseUrl}/polyfill.js`,'))
      .pipe(babel({
        presets: ['es2015'],
        plugins: [
          'transform-regenerator',
          'transform-exponentiation-operator',
        ],
      }))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(dir.dest))));

gulp.task('copyAll', () => (
  gulp.src(`${dir.base}/**/*.*`)
      .pipe(gulp.dest(dir.dest))));

gulp.task('clearAll', () => del(dir.dest));

gulp.task('default',
    gulp.series('clearAll', 'copyAll', 'buildPages', 'buildScripts'));
