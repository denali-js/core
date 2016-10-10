const Funnel = require('broccoli-funnel');
const MergeTree = require('broccoli-merge-trees');
const BabelTree = require('broccoli-babel-transpiler');

let trees = [];

let lib = 'lib';
lib = new BabelTree(lib);
lib = new Funnel(lib, { destDir: 'lib' });
trees.push(lib);

if (process.env.NODE_ENV === 'test') {
  let test = 'test';
  test = new BabelTree(test);
  test = new Funnel(test, { destDir: 'test' });
  trees.push(test);
}

module.exports = new MergeTree(trees);
