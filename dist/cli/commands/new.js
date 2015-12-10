'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _blueprint = require('./tasks/blueprint');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var args = process.argv.slice(2);

(0, _blueprint.generate)({
  src: _path2.default.join(__dirname, './blueprints/app'),
  dest: _path2.default.join(process.cwd(), args[0]),
  args: args
});