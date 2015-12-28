'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = destroy;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _diveSync = require('diveSync');

var _diveSync2 = _interopRequireDefault(_diveSync);

var _trash = require('trash');

var _trash2 = _interopRequireDefault(_trash);

var _utils = require('../../utils');

var _template = require('lodash/string/template');

var _template2 = _interopRequireDefault(_template);

var _blueprintFor = require('./blueprint-for');

var _blueprintFor2 = _interopRequireDefault(_blueprintFor);

var _runWithCwd = require('./run-with-cwd');

var _runWithCwd2 = _interopRequireDefault(_runWithCwd);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function destroy(options) {
  var templateFiles = _path2.default.join(options.src, 'files');
  var blueprint = (0, _blueprintFor2.default)(options.src);
  var data = blueprint.locals(options.args);

  var filesToDelete = [];
  (0, _diveSync2.default)(templateFiles, { all: true }, function (err, absolutepath) {
    return filesToDelete.push(absolutepath);
  });

  // Get the absolute paths for the template source file and the dest file
  filesToDelete = filesToDelete.map(function (absolutepath) {
    var relativepath = _path2.default.relative(templateFiles, absolutepath);
    var filenameTemplate = (0, _template2.default)(relativepath, { interpolate: /__([\S]+)__/g });
    var destRelativepath = filenameTemplate(data);
    var destAbsolutepath = _path2.default.join(options.dest, destRelativepath);
    return { destAbsolutepath: destAbsolutepath, destRelativepath: destRelativepath, absolutepath: absolutepath };

    // Ensure that the dest file actually exists
  }).filter(function (_ref) {
    var destAbsolutepath = _ref.destAbsolutepath;
    var destRelativepath = _ref.destRelativepath;
    var absolutepath = _ref.absolutepath;

    if ((0, _utils.isDir)(absolutepath)) {
      return false;
    }
    var fileExists = _fs2.default.existsSync(destAbsolutepath);
    if (!fileExists) {
      console.log('  ' + _chalk2.default.grey('missing') + ' ' + destRelativepath);
    }
    return fileExists;

    // And either hasn't been altered, or the force option is being used, to
    // ensure we don't destroy code
  }).filter(function (_ref2) {
    var destAbsolutepath = _ref2.destAbsolutepath;
    var absolutepath = _ref2.absolutepath;
    var destRelativepath = _ref2.destRelativepath;

    var templateSrc = (0, _utils.read)(absolutepath);
    var compiled = (0, _template2.default)(templateSrc);
    var destFileIsNotDirty = (0, _utils.read)(destAbsolutepath) === compiled(data);

    if (destFileIsNotDirty) {
      console.log('  ' + _chalk2.default.red('destroy') + ' ' + destRelativepath);
    } else {
      console.log('  ' + _chalk2.default.blue('skipped') + ' ' + destRelativepath);
    }

    return destFileIsNotDirty;
  }).map(function (_ref3) {
    var destAbsolutepath = _ref3.destAbsolutepath;

    return destAbsolutepath;
  });

  (0, _trash2.default)(filesToDelete, function () {
    (0, _runWithCwd2.default)(options.dest, blueprint.postUninstall, data, options);
  });
}
module.exports = exports['default'];