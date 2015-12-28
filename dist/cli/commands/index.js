'use strict';

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _findupSync = require('findup-sync');

var _findupSync2 = _interopRequireDefault(_findupSync);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var pkg = require((0, _findupSync2.default)('package.json', { cwd: __dirname }));

process.argv[2] = process.argv[2] || 'help';

_commander2.default.version(pkg.version).command('new', 'scaffold a new denali project').command('server', 'run the denali app server').command('test', 'run the test suite, and optionally re-run on changes').command('generate', 'generate boilerplate code from templates').command('install', 'install a Denali addon').command('docs', 'generate API docs for your Denali app').command('destroy', 'remove scaffolding created by the generate command');

var result = _commander2.default.parse(process.argv);

if (result) {
  console.log(_chalk2.default.red.bold('\nCommand "' + process.argv[2] + '" not recognized'));
  _commander2.default.outputHelp();
}