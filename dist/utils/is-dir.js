'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isDir;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isDir(path) {
  return _fs2.default.existsSync(path) && _fs2.default.statSync(path).isDirectory();
}