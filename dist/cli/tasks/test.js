'use strict';

require('babel/register');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _requireDir = require('require-dir');

var _requireDir2 = _interopRequireDefault(_requireDir);

var _utils = require('../../utils');

var _forIn = require('lodash/object/forIn');

var _forIn2 = _interopRequireDefault(_forIn);

var _camelCase = require('lodash/string/camelCase');

var _camelCase2 = _interopRequireDefault(_camelCase);

var _mocha = require('mocha');

var _mocha2 = _interopRequireDefault(_mocha);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_commander2.default.option('-g --grep <regex filter>').parse(process.argv);

// Load helpers
/* global createServer */
var defaultHelpers = (0, _requireDir2.default)('../../testing/helpers');
registerHelpers(defaultHelpers, global);
var appHelpers = (0, _requireDir2.default)(_path2.default.join(process.cwd(), 'test', 'helpers'));
registerHelpers(appHelpers, global);

// Load mocha
var mocha = new _mocha2.default({
  ui: 'bdd',
  grep: _commander2.default.grep
});
_glob2.default.sync(_path2.default.join(process.cwd(), 'test/**/*.js')).forEach(function (file) {
  mocha.addFile(file);
});

// Initial setup for tests
createServer();

// Run them!
mocha.run(function (failures) {
  process.on('exit', function () {
    process.exit(failures);
  });
});

function registerHelpers(helpers, container) {
  (0, _forIn2.default)(helpers, function (helper, filepath) {
    var helperName = (0, _camelCase2.default)(_path2.default.basename((0, _utils.withoutExt)(filepath)));
    container[helper.name || helperName] = helper.bind(container);
  });
}