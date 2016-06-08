import gulp from 'gulp';
import sourcemaps from 'gulp-sourcemaps';
import babel from 'gulp-babel';
import gulpIf from 'gulp-if';
import del from 'del';

const dirs = { src: 'src', dest: 'lib' };

gulp.task('build', () => gulp.src(`${dirs.src}/**/*.*`)
    .pipe(gulpIf(file => file.extname.match(/(?:js|css)/), sourcemaps.init()))
    .pipe(gulpIf(file => file.extname === '.js', babel()))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(dirs.dest)));

gulp.task('clear', () => del(dirs.dest));

gulp.task('default', gulp.series('clear', 'build'));
