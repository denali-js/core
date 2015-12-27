'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _broccoliBabelTranspiler = require('broccoli-babel-transpiler');

var _broccoliBabelTranspiler2 = _interopRequireDefault(_broccoliBabelTranspiler);

var _denaliApp = require('./denali-app');

var _denaliApp2 = _interopRequireDefault(_denaliApp);

var _broccoliMergeTrees = require('broccoli-merge-trees');

var _broccoliMergeTrees2 = _interopRequireDefault(_broccoliMergeTrees);

var _broccoliUglifyWriter = require('broccoli-uglify-writer');

var _broccoliUglifyWriter2 = _interopRequireDefault(_broccoliUglifyWriter);

var _broccoliLintEslint = require('broccoli-lint-eslint');

var _broccoliLintEslint2 = _interopRequireDefault(_broccoliLintEslint);

var _broccoliStew = require('broccoli-stew');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _denaliApp2.default.extend({
  toTree: function toTree() {
    var appTree = this._super.apply(this, arguments);
    return (0, _broccoliMergeTrees2.default)([appTree, this.treeForTests()]);
  },
  treeForTests: function treeForTests() {
    var testTree = 'test';
    testTree = this.lintTree(testTree);
    testTree = (0, _broccoliBabelTranspiler2.default)(testTree, { browserPolyfill: true });
    testTree = (0, _broccoliUglifyWriter2.default)(testTree);
    var lintTestsTree = this.treeForLintTests();
    lintTestsTree = (0, _broccoliStew.mv)(lintTestsTree, 'test/lint');
    return (0, _broccoliMergeTrees2.default)([testTree, lintTestsTree]);
  },
  treeForLintTests: function treeForLintTests() {
    var lintTestsTree = (0, _broccoliMergeTrees2.default)(['app', 'config', 'test']);
    return (0, _broccoliLintEslint2.default)(lintTestsTree, {
      testGenerator: function testGenerator(relativepath, errors) {
        return '\n          var assert = require(\'assert\');\n          describe(\'' + relativepath + '\', function() {\n            it(\'should pass eslint\', function() {\n              assert(' + (errors.length === 0) + ');\n            });\n          });\n        ';
      }
    });
  }
});
module.exports = exports['default'];