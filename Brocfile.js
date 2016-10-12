const Funnel = require('broccoli-funnel');
const MergeTree = require('broccoli-merge-trees');
const BabelTree = require('broccoli-babel-transpiler');

let babelOptions = {
  presets: [ 'latest' ],
  plugins: [ 'transform-class-properties' ],
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

let trees = [];

let lib = 'lib';
lib = new Funnel(lib, { destDir: 'lib' });
lib = new BabelTree(lib, babelOptions);
trees.push(lib);

if (process.env.NODE_ENV === 'test') {
  let test = 'test';
  test = new Funnel(test, { destDir: 'test' });
  test = new BabelTree(test, babelOptions);
  trees.push(test);
}

module.exports = new MergeTree(trees);
