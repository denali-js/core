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
    this.environment = options.environment;

    this.pkg = require(path.join(this.dir, 'package.json'));
  }

  get isAddon() {
    return this.pkg.keywords && this.pkg.keywords.includes('denali-addon');
  }

  get isProjectRoot() {
    return this.project.dir === this.dir;
  }

  sourceDirs() {
    let dirs = [ 'app', 'config', 'lib' ];
    if (this.environment === 'test') {
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
        'blueprints/*/files/**',
        'test/dummy/**'
      ]
    };
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

    if (this.isAddon) {
      // If this is an addon, the project root, and we are building
      // for "test", we want to move the tests from the addon up to the dummy
      // app so they are actually run, but move everything else into
      // node_modules like normal.
      if (this.isProjectRoot && this.environment === 'test') {
        let addonTests = new Funnel(mergedSource, { include: [ 'test/**/*' ] });
        let addonWithoutTests = new Funnel(mergedSource, {
          exclude: [ 'test/**/*' ],
          destDir: `node_modules/${ this.pkg.name }`
        });
        mergedSource = new MergeTree([ addonWithoutTests, addonTests ]);
      // If it's just any old addon, move it into the local node_modules folder
      } else {
        mergedSource = new Funnel(mergedSource, { destDir: `node_modules/${ this.pkg.name }` });
      }
    }

    return mergedSource;
  }

}
