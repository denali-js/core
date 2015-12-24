import babelTree from 'broccoli-babel-transpiler';
import DenaliApp from './denali-app';
import mergeTrees from 'broccoli-merge-trees';
import uglify from 'broccoli-uglify-writer';
import eslint from 'broccoli-lint-eslint';
import { mv } from 'broccoli-stew';

export default DenaliApp.extend({

  toTree() {
    let appTree = this._super(...arguments);
    return mergeTrees([
      appTree,
      this.treeForTests()
    ]);
  },

  treeForTests() {
    let testTree = 'test';
    testTree = this.lintTree(testTree);
    testTree = babelTree(testTree, { browserPolyfill: true });
    testTree = uglify(testTree);
    let lintTestsTree = this.treeForLintTests();
    lintTestsTree = mv(lintTestsTree, 'test/lint');
    return mergeTrees([ testTree, lintTestsTree ]);
  },

  treeForLintTests() {
    let lintTestsTree = mergeTrees([ 'app', 'config', 'test' ]);
    return eslint(lintTestsTree, {
      testGenerator(relativepath, errors) {
        return `
          var assert = require('assert');
          describe('${ relativepath }', function() {
            it('should pass eslint', function() {
              assert(${ errors.length === 0});
            });
          });
        `;
      }
    });
  }

});
