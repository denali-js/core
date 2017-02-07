// This is necessary because when denali is building itself, it needs to peek
// into dist/ to get the transpiled versions. When it's being used as a dep,
// this file is being loaded from the dist/ folder already.
let denaliLibPath;
if (process.cwd() === __dirname) {
  denaliLibPath = 'dist/lib';
} else {
  denaliLibPath = 'lib';
}

const path = require('path');
const Builder = require(`./${ path.join(denaliLibPath, 'cli/builder') }`).default;
const LintTree = require(`./${ path.join(denaliLibPath, 'cli/lint-tree') }`).default;
const fs = require('fs');
const TypescriptTree = require('broccoli-typescript-compiler');
const Funnel = require('broccoli-funnel');
const MergeTree = require('broccoli-merge-trees');
const Concat = require('broccoli-concat');

module.exports = class DenaliBuilder extends Builder {

  constructor() {
    super(...arguments);
    this.isDevelopingAddon = false;
    this.unbuiltDirs.push('bin');
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
    let tsconfigPath = path.join(dir, 'tsconfig.json');
    let options = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
    let filesToTranspile = new Funnel(tree, { exclude: options.ignore });
    let transpiled = new TypescriptTree(filesToTranspile, { tsconfig: options });
    return new MergeTree([ tree, transpiled ], { overwrite: true });
  }

};
