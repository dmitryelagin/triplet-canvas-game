import gulp from 'gulp';
import sourcemaps from 'gulp-sourcemaps';
import babel from 'gulp-babel';
import gulpIf from 'gulp-if';
import del from 'del';

const dir = { src: 'src', dest: 'build', app: '/app' };

gulp.task('build', () => gulp.src(`${dir.src}/**/*.*`)
    .pipe(gulpIf(vf => vf.extname.match(/(?:js|css)/), sourcemaps.init()))
    .pipe(gulpIf(vf => vf.extname === '.js' && vf.dirname === dir.app, babel()))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(dir.dest)));

gulp.task('clear', () => del(dir.dest));

gulp.task('default', gulp.series('clear', 'build'));
