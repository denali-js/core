'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var workingDir = process.argv[process.argv.length - 1];
process.chdir(workingDir);

var applicationPath = _path2.default.join(process.cwd(), 'app/application');

var Application = undefined;
if (_fs2.default.existsSync(applicationPath + '.js')) {
  Application = require(applicationPath);
} else {
  Application = require('./runtime/application');
}

var environment = process.env.DENALI_ENV || process.env.NODE_ENV || 'development';

var application = new Application({ environment: environment, dir: workingDir });

application.start();

exports.default = application;
module.exports = exports['default'];