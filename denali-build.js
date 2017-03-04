const path = require('path');
const { Builder, ui } = require(`denali-cli`);
const { exec } = require('child_process');

module.exports = class DenaliBuilder extends Builder {

  processSelf(tree, dir) {
    tree = this.transpileTree(tree, dir);
    return tree;
  }

  transpileTree(tree) {
    const Funnel = require('broccoli-funnel');
    const MergeTree = require('broccoli-merge-trees');
    const Plugin = require('broccoli-plugin');
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
    let tsconfig = require(path.join(process.cwd(), 'tsconfig.json'));
    let transpiled = new TypescriptTree(tree, { tsconfig });
    let withoutTS = new Funnel(tree, {
      exclude: [ '**/*.ts' ]
    });
    return new MergeTree([ withoutTS, transpiled ], { overwrite: true, annotation: 'merge typescript outptu' });
  }

};
