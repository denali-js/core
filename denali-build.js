import { Builder } from './lib';
import fs from 'fs';
import path from 'path';
import BabelTree from 'broccoli-babel-transpiler';
import Funnel from 'broccoli-funnel';
import MergeTree from 'broccoli-merge-trees';
import Concat from 'broccoli-concat';
import LintTree from './lib/cli/lint-tree';

export default class DenaliBuilder extends Builder {

  isDevelopingAddon = false;

  unbuiltDirs = [
    'bin'
  ];

  constructor() {
    super(...arguments);
    this.ignoreVulnerabilities.push([ 'jscodeshift@0.3.30' ]);
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
        lintTestTree = new Concat(lintTestTree, {
          outputFile: 'test/linting.js',
          header: `import test from 'ava';\ntest('source passes eslint', (t) => {`,
          footer: '});',
          inputFiles: [ '**/*.lint-test.js' ],
          sourceMapConfig: { enabled: true },
          allowNone: true
        });
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
    let filesToTranspile = new Funnel(tree, { exclude: options.ignore });
    let transpiled = new BabelTree(filesToTranspile, options);
    return new MergeTree([ tree, transpiled ], { overwrite: true });
  }

}
