'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _object = require('./object');

var _object2 = _interopRequireDefault(_object);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Service = _object2.default.extend();

Service._instantiate = true;
Service._singleton = true;

exports.default = Service;
module.exports = exports['default'];