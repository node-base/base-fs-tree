# base-fs-tree [![NPM version](https://img.shields.io/npm/v/base-fs-tree.svg?style=flat)](https://www.npmjs.com/package/base-fs-tree) [![NPM downloads](https://img.shields.io/npm/dm/base-fs-tree.svg?style=flat)](https://npmjs.org/package/base-fs-tree) [![Build Status](https://img.shields.io/travis/node-base/base-fs-tree.svg?style=flat)](https://travis-ci.org/node-base/base-fs-tree)

Base plugin for creating file trees using archy. Requires the base-fs plugin, but can also be used as a gulp plugin.

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install --save base-fs-tree
```

## Usage

```js
var tree = require('base-fs-tree');
```

### gulp plugin example

The following examples will work with [base-fs](https://github.com/node-base/base-fs), [gulp](http://gulpjs.com), [verb](https://github.com/verbose/verb), [assemble](https://github.com/assemble/assemble), [generate](https://github.com/generate/generate), [update](https://github.com/update/update) or any other application that supports vinyl streams.

```js
var tree = require('base-fs-tree');
var gulp = require('gulp');

gulp.task('default', function(cb) {
  return gulp.src('some-files/**/*.*')
    .pipe(tree.create())
    .pipe(gulp.dest('trees'))
});
```

**Get files before they're modified**

If you want to create a tree from the _original_ unmodified source file paths, use `.capture()` first thing in the stream:

```js
var tree = require('base-fs-tree');
var gulp = require('gulp');

gulp.task('default', function(cb) {
  return gulp.src('some-files/**/*.*')
    .pipe(tree.capture()) //<= capture files

    // gulp plugin pipeline
    .pipe(otherPlugins())
    .pipe(gulp.dest('dist')) 

    .pipe(tree.create()) //<= create tree
    .pipe(gulp.dest('trees'))
});
```

### Command line tips

You can conditionally generate trees using a command line flag, like `--tree`.

```js
var tree = require('base-fs-tree');
var gulp = require('gulp');
var argv = require('yargs-parser')(process.argv.slice(2), {
  default: {tree: false}
});

gulp.task('default', function(cb) {
  return gulp.src('some-files/**/*.*')
    .pipe(tree.create(argv))
    .pipe(gulp.dest('trees'))
});
```

### base plugin example

This can also be used as a _non-pipeline_ plugin with [base](https://github.com/node-base/base) applications. It works by adding `.preWrite` middleware and a `taskEnd` listener, so that anytime `taskEnd` is emitted, a tree will be automatically generates.

This can be useful when you want to automatically generate trees for all tasks in a [generate](https://github.com/generate/generate) generator, for example.

```js
var tree = require('base-fs-tree');
var vfs = require('base-fs');
var Base = require('base');
var base = new Base();
base.use(vfs());
base.use(tree());

app.task('default', function(cb) {
  app.src('some-files/**/*.*')
    .pipe(app.dest('trees'))
    .on('end', function() {
      // emit `taskEnd` with the name of the task
      app.emit('taskEnd', 'default');
      cb();
    });
});
```

## About

### Related projects

* [base-fs-conflicts](https://www.npmjs.com/package/base-fs-conflicts): Detect potential file system conflicts and if necessary prompt the user before overwriting files. | [homepage](https://github.com/node-base/base-fs-conflicts "Detect potential file system conflicts and if necessary prompt the user before overwriting files.")
* [base-fs](https://www.npmjs.com/package/base-fs): base-methods plugin that adds vinyl-fs methods to your 'base' application for working with the file… [more](https://github.com/node-base/base-fs) | [homepage](https://github.com/node-base/base-fs "base-methods plugin that adds vinyl-fs methods to your 'base' application for working with the file system, like src, dest, copy and symlink.")
* [base-task](https://www.npmjs.com/package/base-task): base plugin that provides a very thin wrapper around [https://github.com/doowb/composer](https://github.com/doowb/composer) for adding task methods to… [more](https://github.com/node-base/base-task) | [homepage](https://github.com/node-base/base-task "base plugin that provides a very thin wrapper around <https://github.com/doowb/composer> for adding task methods to your application.")

### Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](../../issues/new).

### Building docs

_(This document was generated by [verb-generate-readme](https://github.com/verbose/verb-generate-readme) (a [verb](https://github.com/verbose/verb) generator), please don't edit the readme directly. Any changes to the readme must be made in [.verb.md](.verb.md).)_

To generate the readme and API documentation with [verb](https://github.com/verbose/verb):

```sh
$ npm install -g verb verb-generate-readme && verb
```

### Running tests

Install dev dependencies:

```sh
$ npm install -d && npm test
```

### Author

**Jon Schlinkert**

* [github/jonschlinkert](https://github.com/jonschlinkert)
* [twitter/jonschlinkert](http://twitter.com/jonschlinkert)

### License

Copyright © 2016, [Jon Schlinkert](https://github.com/jonschlinkert).
Released under the [MIT license](https://github.com/node-base/base-fs-tree/blob/master/LICENSE).

***

_This file was generated by [verb-generate-readme](https://github.com/verbose/verb-generate-readme), v0.1.28, on July 31, 2016._