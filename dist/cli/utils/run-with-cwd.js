"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = runWithCwd;
function runWithCwd(cwd, fn) {
  var originalCwd = process.cwd();
  process.chdir(cwd);

  for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  fn.apply(undefined, args);
  process.chdir(originalCwd);
}
module.exports = exports['default'];