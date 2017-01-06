const { Builder } = require('./lib');
const fs = require('fs');
const path = require('path');
const BabelTree = require('broccoli-babel-transpiler');
const Funnel = require('broccoli-funnel');
const MergeTree = require('broccoli-merge-trees');
const LintTree = require('./lib/cli/lint-tree');

module.exports = class DenaliBuilder extends Builder {

  constructor() {
    super(...arguments);
    this.isDevelopingAddon = true;
    this.unbuiltDirs = [
      'bin'
    ];
  }

  processSelf(tree, dir) {
    tree = this.lintTree(tree, dir);
    tree = this.transpileTree(tree, dir);
    return tree;
  }

  lintTree(tree, dir) {
    if (this.project.lint) {
      // If it's in test environment, generate test modules for each linted file
      if (this.project.environment === 'test') {
        let lintTestTree = new LintTree(tree, { generateTests: true, rootDir: dir });
        lintTestTree = new Funnel(lintTestTree, { destDir: 'test/lint' });
        return new MergeTree([ lintTestTree, tree ]);
      }
      // Otherwise, just lint and move on
      return new LintTree(tree, { rootDir: dir });
    }
    return tree;
  }

  transpileTree(tree, dir) {
    let babelrcPath = path.join(dir, '.babelrc');
    let options = JSON.parse(fs.readFileSync(babelrcPath, 'utf-8'));
    options.sourceMaps = 'inline';
    options.sourceRoot = dir;
    return new BabelTree(new Funnel(tree, { exclude: options.ignore }), options);
  }

};
