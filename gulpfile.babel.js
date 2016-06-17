// TODO Delete obsolete comments when needed
import gulp from 'gulp';
import sourcemaps from 'gulp-sourcemaps';
import babel from 'gulp-babel';
import gulpIf from 'gulp-if';
import del from 'del';

const dir = { src: 'src', dest: 'build', app: 'app' };

gulp.task('build', () => gulp.src(`${dir.src}/**/*.*`)
    .pipe(gulpIf(f => f.extname.match(/(?:js|css)/), sourcemaps.init()))
    .pipe(gulpIf(f => f.dirname.match(`(${dir.app})$`), babel({
      presets: ['es2015'],
      plugins: [
        // 'transform-es2015-modules-amd',
        'transform-exponentiation-operator',
      ],
    })))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(dir.dest)));

gulp.task('clear', () => del(dir.dest));

gulp.task('default', gulp.series('clear', 'build'));
