const path = require('path');
const { Builder, ui } = require(`denali-cli`);
const Plugin = require('broccoli-plugin');
const Funnel = require('broccoli-funnel');
const MergeTree = require('broccoli-merge-trees');
// const TypescriptTree = require('broccoli-typescript-compiler');
const { exec } = require('child_process');
// const Concat = require('broccoli-concat');

class TypescriptTree extends Plugin {
  constructor(tree, options) {
    return super([tree], options);
  }
  build() {
    return new Promise((resolve, reject) => {
      exec(path.join(process.cwd(), 'node_modules/.bin/tsc') + ' --outDir ' + this.outputPath, {
        cwd: this.inputPaths[0],
        stdio: 'inherit'
      }, (err, stdout, stderr) => {
        if (err) {
          if (stdout.match(/error TS\d+/)) {
            ui.warn(`\n===> ${ stdout.split('\n').length } Typescript Errors:`);
            ui.warn(stdout.replace(/^\.\.\/\.\.\//mg, ''));
          } else {
            return reject(err);
          }
        }
        resolve();
      });
    });
  }
}

module.exports = class DenaliBuilder extends Builder {

  constructor() {
    super(...arguments);
    this.isDevelopingAddon = false;
    // this.unbuiltDirs.push('bin');
  }

  processSelf(tree, dir) {
    // tree = this.lintTree(tree, dir);
    tree = this.transpileTree(tree, dir);
    return tree;
  }

  // lintTree(tree, dir) {
  //   if (this.project.lint) {
  //     // If it's in test environment, generate test modules for each linted file
  //     if (this.project.environment === 'test') {
  //       let lintTestTree = new LintTree(tree, { generateTests: true, rootDir: dir });
  //       lintTestTree = new Funnel(lintTestTree, { destDir: 'test/lint' });
  //       lintTestTree = new Concat(lintTestTree, {
  //         outputFile: 'test/linting.js',
  //         header: `import test from 'ava';\ntest('source passes eslint', (t) => {`,
  //         footer: '});',
  //         inputFiles: [ '**/*.lint-test.js' ],
  //         sourceMapConfig: { enabled: true },
  //         allowNone: true
  //       });
  //       return new MergeTree([ lintTestTree, tree ]);
  //     }
  //     // Otherwise, just lint and move on
  //     return new LintTree(tree, { rootDir: dir });
  //   }
  //   return tree;
  // }

  transpileTree(tree) {
    let tsconfig = require(path.join(process.cwd(), 'tsconfig.json'));
    let transpiled = new TypescriptTree(tree, { tsconfig });
    let withoutTS = new Funnel(tree, {
      exclude: [ '**/*.ts' ]
    });
    return new MergeTree([ withoutTS, transpiled ], { overwrite: true, annotation: 'merge typescript outptu' });
  }

};
