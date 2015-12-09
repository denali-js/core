'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = withoutExt;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function withoutExt(f) {
  return _path2.default.join(_path2.default.dirname(f), _path2.default.basename(f, _path2.default.extname(f)));
}