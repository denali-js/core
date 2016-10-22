import fs from 'fs';
import path from 'path';
import upperFirst from 'lodash/upperFirst';
import Funnel from 'broccoli-funnel';
import BabelTree from 'broccoli-babel-transpiler';
import MergeTree from 'broccoli-merge-trees';
import LintTree from './lint-tree';
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
          return new LintTree(tree, { generateTests: true, rootDir: this.dir });
        });
        let lintTestTree = new MergeTree(lintTestTrees);
        lintTestTree = new Funnel(lintTestTree, { destDir: 'test/lint' });
        sourceTrees.push(lintTestTree);
      // Otherwise, just lint and move on
      } else {
        sourceTrees = sourceTrees.map((tree) => {
          return new LintTree(tree, { rootDir: this.dir });
        });
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
