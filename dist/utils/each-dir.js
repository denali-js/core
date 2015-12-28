'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = eachDir;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function eachDir(dirpath, fn) {
  _fs2.default.readdirSync(dirpath).forEach(function (childpath) {
    var absolutepath = _path2.default.join(dirpath, childpath);
    if (_fs2.default.statSync(absolutepath).isDirectory()) {
      fn(childpath);
    }
  });
}
module.exports = exports['default'];