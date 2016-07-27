'use strict';

var path = require('path');
var archy = require('archy');
var isValid = require('is-valid-app');
var isObject = require('isobject');
var contents = require('file-contents');
var extend = require('extend-shallow');
var through = require('through2');
var write = require('write');
var File = require('vinyl');
var cache;

/**
 * Create file trees
 */

module.exports = function(config) {
  config = config || {};
  cache = cache || {};
  var namespace = config.name || 'default';
  cache[namespace] = cache[namespace] || {src: {}, dest: {}};

  function plugin(app) {
    if (!isValid(app, 'base-fs-tree')) return;

    var method = app.prePlugins ? 'prePlugins' : 'onStream';
    app[method](/./, function(file, next) {
      var opts = extend({}, config, app.options);
      if (opts.tree !== false && !file.isTree) {
        addFile(cache[namespace], file, {}, 'src');
      }
      next();
    });

    app.preWrite(/./, function(file, next) {
      var opts = extend({}, config, app.options);
      file.writeFile = !opts.treeOnly && file.isTree;
      next();
    });

    app.postWrite(/./, function(file, next) {
      var opts = extend({}, config, app.options);
      if (opts.tree !== false && !file.isTree) {
        addFile(cache[namespace], file, {}, 'dest');
      }
      next();
    });

    app.define('createTrees', function(options) {
      console.log(this.env)
      var opts = extend({name: 'default'}, config, app.options, options);
      if (opts.tree !== false) {
        writeFile(cache, 'dest', namespace, opts);
        writeFile(cache, 'src', namespace, opts);
      }
      // always reset the cache
      cache[namespace] = {src: {}, dest: {}};
    });

    return plugin;
  };

  plugin.capture = function(name, options) {
    if (isObject(name)) {
      options = name;
      name = null;
    }
    var opts = extend({name: name || 'default'}, config, options);
    var prop = opts.name;

    cache = cache || {};
    cache[prop] = {src: {}, dest: {}};

    return through.obj(function(file, enc, next) {
      if (opts.tree !== false) {
        file._isCaptured = true;
        addFile(cache[prop], file, opts, 'src');
      }
      file.writeFile = opts.treeOnly === false;
      next(null, file);
    });
  };

  plugin.create = function(name, options) {
    if (isObject(name)) {
      options = name;
      name = null;
    }

    var opts = extend({name: name || 'default'}, config, options);
    var prop = opts.name;

    cache = cache || {};
    cache[prop] || (cache[prop] = {src: {}, dest: {}});

    return through.obj(function(file, enc, next) {
      if (opts.tree !== false) {
        if (!file._isCaptured) {
          addFile(cache[prop], file, opts, 'src');
        }
        addFile(cache[prop], file, opts, 'dest');
      }
      file.writeFile = opts.treeOnly === false;
      next();
    }, function(next) {
      if (opts.tree !== false) {
        createFile(this, cache[prop], 'dest', prop, opts);
        createFile(this, cache[prop], 'src', prop, opts);
        cache[prop] = cache[prop] = {src: {}, dest: {}};
      }
      next();
    });
  };

  function createFile(stream, tree, name, prop, options) {
    var opts = extend({}, options);
    var str = create(tree[name], {label: 'cwd'});
    var file = new File({path: `${prop}-${name}.txt`, contents: new Buffer(str)});

    if (typeof opts.treename === 'function') {
      opts.treename(file);
    }

    file.writeFile = true;
    file.render = false;
    file.layout = null;
    file.isTree = true;
    contents.sync(file);
    stream.push(file);
  }

  function writeFile(obj, prop, namespace, options) {
    var opts = extend({}, config, options);
    var dest = path.resolve.bind(path, __dirname);
    var str = create(obj[namespace][prop], {label: namespace});

    if (opts.name !== namespace) {
      namespace = `${namespace}-${opts.name}`;
    }

    var destPath = opts.destPath || `${namespace}-${prop}.txt`;
    if (typeof opts.dest === 'string') {
      destPath = path.resolve(opts.dest, destPath);
    }

    var file = new File({path: destPath, contents: new Buffer(str)});
    contents.sync(file);

    if (typeof opts.treename === 'function') {
      opts.treename(file);
    }

    var destBase = file.dirname;
    if (typeof opts.dest === 'function') {
      destBase = path.resolve(opts.dest(file) || destBase);
    }
    destPath = path.resolve(destBase, file.path);
    write.sync(dest(destPath), file.contents.toString());
  }
  return plugin;
};

function addFile(tree, file, options, name) {
  if (isCached(file, name)) return;
  var opts = extend({label: 'cwd', prefix: ''}, options);
  var cwd = typeof opts.cwd === 'string' ? opts.cwd : process.cwd();
  addBranch(tree[name], path.join(opts.label, path.relative(cwd, file.path)));
}

function isCached(file, name) {
  if (!name && file._added) {
    return true;
  }
  if (name) {
    file._added = file._added || {};
    if (file._added[name]) {
      return true;
    }
    file._added[name] = true;
    return false;
  }
  file._added = true;
  return false;
}

function create(tree, options) {
  var opts = extend({label: 'cwd', prefix: ' '}, options);
  var obj = tree[opts.label] || tree.cwd;
  var archytree = createTree(obj, {}, opts.label);
  var str = archy(archytree, opts.prefix, opts);
  return str.replace(/^[^\n]+/, '.');
}

function addBranch(tree, path) {
  var segs = path.split(/[\\\/]/);
  var len = segs.length;
  var end = len - 1;
  var idx = -1;
  while (++idx < len) {
    if (idx === end) {
      tree[segs[idx]] = null;
    } else if (!tree[segs[idx]]) {
      tree[segs[idx]] = {};
    }
    tree = tree[segs[idx]];
  }
}

function createTree(tree, obj, label) {
  obj.label = label;
  for (var key in tree) {
    obj.nodes = obj.nodes || [];
    obj.nodes.push(tree[key] ? createTree(tree[key], {}, key) : key);
  }
  return obj;
}
