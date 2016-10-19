import fs from 'fs';
import path from 'path';
import upperFirst from 'lodash/upperFirst';
import dedent from 'dedent-js';
import escape from 'js-string-escape';
import Funnel from 'broccoli-funnel';
import BabelTree from 'broccoli-babel-transpiler';
import LintTree from 'broccoli-lint-eslint';
import MergeTree from 'broccoli-merge-trees';
import PackageTree from './package-tree';

export default class BuildOrigin {

  constructor(dir, project, options = {}) {
    this.dir = dir;
    this.project = project;
    this.lint = options.lint;
    this.isDummy = options.isDummy;
    this.pkg = require(path.join(this.dir, 'package.json'));
  }

  sourceDirs() {
    let dirs = [ 'app', 'config', 'lib' ];
    if (this.project.environment === 'test') {
      dirs.push('test');
    }
    return dirs;
  }

  treeFor(dir) {
    return dir;
  }

  generateLintTestTree(tree) {
    return new LintTree(tree, {
      testGenerator(relativePath, errors, results) {
        let passed = !results.errorCount || results.errorCount.length === 0;
        let messages = `${ relativePath } should pass ESLint`;
        if (results.messages) {
          messages += '\n\n';
          messages += errors.map((error) => {
            return `${ error.line }:${ error.column } - ${ error.message } (${ error.ruleId })`;
          }).join('\n');
        }
        let output = dedent`import { AssertionError } from 'must';
                            describe('ESLint | ${ escape(relativePath) }', function() {
                              it('should pass ESLint', function() {
                            `;
        if (passed) {
          output += '    // ESLint passed\n';
        } else {
          output += dedent`// ESLint failed
                           let error = new AssertionError('${ escape(messages) }');
                           error.stack = undefined;
                           throw error;`;
        }
        output += `  });\n});\n`;
        return output;
      },
      format() {
        return '\r';
      }
    });
  }

  lintTree(tree) {
    return new LintTree(tree);
  }

  transformSourceTree(tree) {
    return new BabelTree(tree, this.babelOptions());
  }

  babelOptions() {
    return {
      presets: [ 'latest' ],
      plugins: [
        'transform-class-properties',
        'transform-async-to-generator'
      ],
      ignore: [
        'lib/cli/blueprints/*/files/**',
        'test/fixtures/cli/**'
      ],
      env: {
        test: {
          plugins: [ 'istanbul' ]
        }
      }
    };
  }

  treeForTest() {
    if (this.isDummy) {
      return '..';
    }
    return 'test';
  }

  toTree() {
    let dirs = this.sourceDirs();

    let sourceTrees = dirs.map((dir) => {
      let treeFor = this[`treeFor${ upperFirst(dir) }`] || this.treeFor;
      let tree = treeFor.call(this, dir);
      if (typeof tree !== 'string' || fs.existsSync(path.join(this.dir, tree))) {
        return new Funnel(path.join(this.dir, tree), { annotation: dir, destDir: dir });
      }
      return false;
    }).filter(Boolean);

    // We do this first because broccoli-lint-eslint is weird
    // https://github.com/ember-cli/broccoli-lint-eslint/pull/25
    if (this.lint) {
      // If it's in test environment, generate test modules for each linted file
      if (this.project.environment === 'test') {
        let lintTestTrees = sourceTrees.map((tree) => {
          return this.generateLintTestTree(tree);
        });
        let lintTestTree = new MergeTree(lintTestTrees);
        lintTestTree = new Funnel(lintTestTree, { destDir: 'test/lint' });
        sourceTrees.push(lintTestTree);
      // Otherwise, just lint and move on
      } else {
        sourceTrees = sourceTrees.map((tree) => this.lintTree(tree));
      }
    }

    sourceTrees = sourceTrees.map((tree) => this.transformSourceTree(tree));
    sourceTrees.push(new PackageTree(this.pkg));
    let mergedSource = new MergeTree(sourceTrees, { overwrite: true });

    // If this is an addon builder, move the source into a node_modules folder
    if (this.project.appBuilder !== this) {
      mergedSource = new Funnel(mergedSource, { destDir: `node_modules/${ this.pkg.name }` });
    }

    return mergedSource;
  }

}
