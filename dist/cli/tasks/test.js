/* global createServer */
import 'babel/register';
import path from 'path';
import requireDir from 'require-dir';
import { withoutExt } from '../../utils';
import forIn from 'lodash/object/forIn';
import camelCase from 'lodash/string/camelCase';
import Mocha from 'mocha';
import glob from 'glob';
import program from 'commander';

program.option('-g --grep <regex filter>').parse(process.argv);

// Load helpers
let defaultHelpers = requireDir('../../testing/helpers');
registerHelpers(defaultHelpers, global);
let appHelpers = requireDir(path.join(process.cwd(), 'test', 'helpers'));
registerHelpers(appHelpers, global);

// Load mocha
var mocha = new Mocha({
  ui: 'bdd',
  grep: program.grep
});
glob.sync(path.join(process.cwd(), 'test/**/*.js')).forEach(file => {
  mocha.addFile(file);
});

// Initial setup for tests
createServer();

// Run them!
mocha.run(failures => {
  process.on('exit', () => {
    process.exit(failures);
  });
});

function registerHelpers(helpers, container) {
  forIn(helpers, (helper, filepath) => {
    let helperName = camelCase(path.basename(withoutExt(filepath)));
    container[helper.name || helperName] = helper.bind(container);
  });
}