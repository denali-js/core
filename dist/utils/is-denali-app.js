'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isDenaliApp;

var _findupSync = require('findup-sync');

var _findupSync2 = _interopRequireDefault(_findupSync);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Returns a Boolean indicating whether or not the supplied directory
 * contains a Denali application. The result is based on whether denali is
 * found as a direct dependency of the package in the directory.
 *
 * @method isDenaliApp
 *
 * @param  {String}  dirpath  The directory containing the application
 *
 * @return {Boolean}  `true` if the directory contains a Denali application
 */
function isDenaliApp(dirpath) {
  var pkgpath = (0, _findupSync2.default)('package.json', { cwd: dirpath });
  if (pkgpath) {
    var pkg = require(pkgpath);
    return pkg.dependencies && pkg.dependencies.denali;
  } else {
    return false;
  }
}