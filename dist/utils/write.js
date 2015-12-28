'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = write;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function write(filepath, contents) {
  return _fs2.default.writeFileSync(filepath, contents);
};
module.exports = exports['default'];