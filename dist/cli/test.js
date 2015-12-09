'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _nodemon = require('nodemon');

var _nodemon2 = _interopRequireDefault(_nodemon);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_commander2.default.option('-g --grep <regex filter>', 'Filter tests based on a regex pattern').option('-e --environment <environment>', 'The environment to run in; defaults to "test"', 'test').parse(process.argv);

var testsCommand = 'node ' + _path2.default.join(__dirname, 'tasks', 'test.js');

if (_commander2.default.grep) {
  testsCommand += ' --grep "' + _commander2.default.grep + '"';
}

(0, _nodemon2.default)({
  exec: testsCommand,
  env: { NODE_ENV: _commander2.default.environment },
  ignore: ['node_modules\/(?!denali)', 'node_modules/denali/node_modules']
});

_nodemon2.default.on('restart', function (files) {
  if (files) {
    if (files.length > 1) {
      console.log('\n' + files.length + ' files changed');
    } else {
      console.log('\n' + files[0] + ' changed');
    }
    console.log('Re-running tests ...\n');
  } else {
    console.log('\nRe-running ...\n');
  }
});
_nodemon2.default.on('crash', function () {
  console.log(_chalk2.default.red.bold('Tests crashed! Waiting for file changes to restart ...'));
});
_nodemon2.default.on('quit', function () {
  console.log('Goodbye!');
});