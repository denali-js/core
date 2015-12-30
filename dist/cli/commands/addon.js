'use strict';

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _generateBlueprint = require('../../utils/generate-blueprint');

var _generateBlueprint2 = _interopRequireDefault(_generateBlueprint);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_commander2.default.usage('<addon name>').description('Create a new denali addon in the <addon name> directory.').parse(process.argv);

(0, _generateBlueprint2.default)({
  src: _path2.default.join(__dirname, '..', 'blueprints', 'addon'),
  dest: _path2.default.join(process.cwd(), _commander2.default.args[0]),
  args: _commander2.default.args
});

console.log(_chalk2.default.green('\n' + _commander2.default.args[0] + ' created!'));