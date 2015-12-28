'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _broccoliBabelTranspiler = require('broccoli-babel-transpiler');

var _broccoliBabelTranspiler2 = _interopRequireDefault(_broccoliBabelTranspiler);

var _coreObject = require('core-object');

var _coreObject2 = _interopRequireDefault(_coreObject);

var _broccoli = require('broccoli');

var _broccoli2 = _interopRequireDefault(_broccoli);

var _broccoliMergeTrees = require('broccoli-merge-trees');

var _broccoliMergeTrees2 = _interopRequireDefault(_broccoliMergeTrees);

var _broccoliUglifySourcemap = require('broccoli-uglify-sourcemap');

var _broccoliUglifySourcemap2 = _interopRequireDefault(_broccoliUglifySourcemap);

var _broccoliLintEslint = require('broccoli-lint-eslint');

var _broccoliLintEslint2 = _interopRequireDefault(_broccoliLintEslint);

var _broccoliStew = require('broccoli-stew');

var _broccoliFileCreator = require('broccoli-file-creator');

var _broccoliFileCreator2 = _interopRequireDefault(_broccoliFileCreator);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _broccoliSlowTrees = require('broccoli-slow-trees');

var _broccoliSlowTrees2 = _interopRequireDefault(_broccoliSlowTrees);

var _log = require('../../utils/log');

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _coreObject2.default.extend({

  firstBuild: true,

  build: function build() {
    var _this = this;

    var tree = this.toTree();
    var builder = new _broccoli2.default.Builder(tree, { tmpdir: './tmp' });
    if (this.watch) {
      var watcher = new _broccoli2.default.Watcher(builder);
      watcher.on('change', function () {
        try {
          var duration = Math.round(builder.outputNodeWrapper.buildState.totalTime) + 'ms';
          if (duration > 1000) {
            duration = _chalk2.default.yellow(duration);
          }
          (0, _log2.default)('info', (_this.firstBuild ? 'Build' : 'Rebuild') + ' complete (' + duration + ')');
          _this.afterBuild(builder.outputPath);
          _this.firstBuild = false;
          if (duration > 1000) {
            (0, _broccoliSlowTrees2.default)(builder.outputNodeWrapper);
          }
        } catch (err) {
          console.log(err);
        }
      });
      watcher.watch();
    } else {
      return builder.build().then(function () {
        _this.afterBuild(builder.outputPath);
      });
    }
  },
  toTree: function toTree() {
    return (0, _broccoliMergeTrees2.default)([this.treeForPackage(), (0, _broccoliStew.mv)(this.treeForApp(), 'app'), (0, _broccoliStew.mv)(this.treeForConfig(), 'config')], { overwrite: true });
  },
  lintTree: function lintTree(tree) {
    return (0, _broccoliLintEslint2.default)(tree, {
      throwOnError: false
    });
  },
  treeForPackage: function treeForPackage() {
    // Avoid selecting the root project folder as a tree, so manually write the
    // contents of package.json
    // https://github.com/broccolijs/broccoli/issues/173
    return (0, _broccoliMergeTrees2.default)([(0, _broccoliFileCreator2.default)('package.json', JSON.stringify(this.pkg, null, 2))]);
  },
  treeForApp: function treeForApp() {
    var appTree = 'app';
    appTree = this.processJS(appTree);
    return appTree;
  },
  treeForConfig: function treeForConfig() {
    var configTree = 'config';
    configTree = this.processJS(configTree);
    return configTree;
  },
  processJS: function processJS(tree) {
    // tree = this.lintTree(tree);
    tree = (0, _broccoliBabelTranspiler2.default)(tree, { browserPolyfill: true });
    var shouldMinify = 'minify' in this && this.minify || this.environment === 'production';
    if (shouldMinify) {
      tree = (0, _broccoliUglifySourcemap2.default)(tree);
    }
    return tree;
  }
});
module.exports = exports['default'];