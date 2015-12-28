'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = blueprintFor;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function blueprintFor(srcpath) {
  var blueprint = require(_path2.default.join(srcpath, 'index.js'));
  blueprint.locals = blueprint.locals || function () {
    return {};
  };
  blueprint.postInstall = blueprint.postInstall || function () {};
  blueprint.postUninstall = blueprint.postInstall || function () {};
  return blueprint;
}
module.exports = exports['default'];