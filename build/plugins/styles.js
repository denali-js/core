const MergeTree = require('broccoli-merge-trees');
const Sass = require('broccoli-sass');
const AutoPrefixer = require('broccoli-autoprefixer');

module.exports = function(stylesSrc) {
  let sass = new MergeTree([ 'bower_components', stylesSrc ]);
  let compiledSass = new Sass([ sass ], 'app.scss', 'styles.css');
  let autoprefixed = new AutoPrefixer(compiledSass);
  return autoprefixed;
}
