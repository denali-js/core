'use strict';

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _generateBlueprint = require('../utils/generate-blueprint');

var _generateBlueprint2 = _interopRequireDefault(_generateBlueprint);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var args = process.argv.slice(2);

// TODO - support arbitrary blueprint sources (i.e. local blueprint folder, git repo, etc)
(0, _generateBlueprint2.default)({
  src: _path2.default.join(__dirname, '..', 'blueprints', 'app'),
  dest: _path2.default.join(process.cwd(), args[0]),
  args: args
});

console.log(_chalk2.default.green('\n' + args[0] + ' created!'));