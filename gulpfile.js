const gulp = require("gulp");
const postcss = require("gulp-postcss");
const minifyCss = require("gulp-minify-css");
const uglify = require("gulp-terser");
const rename = require("gulp-rename");
const sourcemaps = require("gulp-sourcemaps");
const autoprefixer = require("autoprefixer");

gulp.task("watch", () => {
    gulp.watch("src/*.css", gulp.parallel("autoprefix"))
    gulp.watch("src/*.js", gulp.parallel("clean-js"))
})

gulp.task("autoprefix", (cb) => {
    gulp.src("src/*.css")
        .pipe(postcss([autoprefixer()]))
        .pipe(gulp.dest("dist"))
        .on("end", cb)
        .on("error", (err) => cb(err))
})

gulp.task("clean-js", (cb) => {
    gulp.src("src/*.js")
        .pipe(uglify({
            compress: false,
            mangle: false,
            format: {
                beautify: true
            }
        }))
        .pipe(gulp.dest("dist"))
        .on("end", cb)
        .on("error", (err) => cb(err))
})

gulp.task("build-css", (cb) => {
    gulp.src("dist/!(*.min)*.css")
        .pipe(sourcemaps.init())
        .pipe(minifyCss())
        .pipe(rename({
            suffix: ".min"
        }))
        .pipe(sourcemaps.write(""))
        .pipe(gulp.dest("dist"))
        .on("end", cb)
        .on("error", (err) => cb(err))
})

gulp.task("build-js", (cb) => {
    gulp.src("dist/!(*.min)*.js")
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(rename({
            suffix: ".min"
        }))
        .pipe(sourcemaps.write(""))
        .pipe(gulp.dest("dist"))
        .on("end", cb)
        .on("error", (err) => cb(err))
})

gulp.task("build-all", gulp.parallel("build-css", "build-js"))

gulp.task("default", gulp.parallel("autoprefix", "clean-js"))

gulp.task("build", gulp.series("default", "build-all"))