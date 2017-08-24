const path = require('path');
const { Builder, ui } = require(`denali-cli`);
const { exec } = require('child_process');
const Funnel = require('broccoli-funnel');
const MergeTree = require('broccoli-merge-trees');
const { typescript: Typescript } = require('broccoli-typescript-compiler');

module.exports = class DenaliBuilder extends Builder {

  processSelf(tree, dir) {
    tree = this.transpileTree(tree, dir);
    return tree;
  }

  transpileTree(tree, dir) {
    let transpiledTS = new Typescript(tree, {
      tsconfig: require(path.join(dir, 'tsconfig.json')),
      annotation: 'compile typescript'
    });
    let withoutTS = new Funnel(tree, {
      exclude: [ '**/*.ts' ]
    });
    return new MergeTree([ withoutTS, transpiledTS ], { overwrite: true, annotation: 'merge typescript output' });
  }

};
