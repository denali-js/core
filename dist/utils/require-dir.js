'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = requireDir;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _walkSync = require('walk-sync');

var _walkSync2 = _interopRequireDefault(_walkSync);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function requireDir(dirpath) {
  var modules = {};
  (0, _walkSync2.default)(dirpath).forEach(function (filepath) {
    var absolutepath = _path2.default.join(dirpath, filepath);
    if (_fs2.default.statSync(absolutepath).isFile() && /\.js$/.test(filepath)) {
      var moduleName = filepath.slice(0, filepath.length - 3);
      modules[moduleName] = require(absolutepath);
    }
  });
  return modules;
}
module.exports = exports['default'];