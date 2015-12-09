'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _denali = require('denali');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = new _denali.Application({
  rootDir: _path2.default.join(__dirname, '..'),
  port: process.env.PORT,
  environment: process.env.DENALI_ENV || process.env.NODE_ENV || 'development'
});