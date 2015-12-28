'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = generate;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _diveSync = require('diveSync');

var _diveSync2 = _interopRequireDefault(_diveSync);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _utils = require('../../utils');

var _template = require('lodash/string/template');

var _template2 = _interopRequireDefault(_template);

var _blueprintFor = require('./blueprint-for');

var _blueprintFor2 = _interopRequireDefault(_blueprintFor);

var _runWithCwd = require('./run-with-cwd');

var _runWithCwd2 = _interopRequireDefault(_runWithCwd);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function generate(options) {
  var templateFiles = _path2.default.join(options.src, 'files');
  var blueprint = (0, _blueprintFor2.default)(options.src);
  var data = blueprint.locals(options.args);

  (0, _diveSync2.default)(templateFiles, { all: true }, function (err, absolutepath) {
    if (err) {
      return console.log('Error generating blueprint:', err.stack || err);
    }
    if ((0, _utils.isDir)(absolutepath)) {
      return null;
    }
    var relativepath = _path2.default.relative(templateFiles, absolutepath);

    var filenameTemplate = (0, _template2.default)(relativepath, { interpolate: /__([\S]+)__/g });
    var destRelativepath = filenameTemplate(data);
    var destAbsolutepath = _path2.default.join(options.dest, destRelativepath);

    if (_fs2.default.existsSync(destAbsolutepath)) {
      return console.log('  ' + _chalk2.default.green('already exists') + ' ' + destRelativepath);
    }

    var contents = (0, _utils.read)(absolutepath);
    var contentsTemplate = (0, _template2.default)(contents);
    _mkdirp2.default.sync(_path2.default.dirname(destAbsolutepath));
    (0, _utils.write)(destAbsolutepath, contentsTemplate(data));
    console.log('  ' + _chalk2.default.green('create') + ' ' + destRelativepath);
  });

  (0, _runWithCwd2.default)(options.dest, blueprint.postInstall, data, options);
}
module.exports = exports['default'];