'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generate = generate;
exports.destroy = destroy;

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

var _trash = require('trash');

var _trash2 = _interopRequireDefault(_trash);

var _utils = require('../../utils');

var _template = require('lodash/string/template');

var _template2 = _interopRequireDefault(_template);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function generate(options) {
  var templateFiles = _path2.default.join(options.src, 'files');
  var blueprint = blueprintFor(options.src);
  var data = blueprint.locals(options.args);

  (0, _diveSync2.default)(templateFiles, { all: true }, function (err, absolutepath) {
    if ((0, _utils.isDir)(absolutepath)) {
      return;
    }
    var relativepath = _path2.default.relative(templateFiles, absolutepath);

    var filenameTemplate = (0, _template2.default)(relativepath, { interpolate: /__([\S]+)__/g });
    var destRelativepath = filenameTemplate(data);
    var destAbsolutepath = _path2.default.join(options.dest, destRelativepath);

    if (_fs2.default.existsSync(destAbsolutepath)) {
      console.log('  ' + _chalk2.default.green('already exists') + ' ' + destRelativepath);
      return;
    }

    var contents = (0, _utils.read)(absolutepath);
    var contentsTemplate = (0, _template2.default)(contents);
    _mkdirp2.default.sync(_path2.default.dirname(destAbsolutepath));
    (0, _utils.write)(destAbsolutepath, contentsTemplate(data));
    console.log('  ' + _chalk2.default.green('create') + ' ' + destRelativepath);
  });

  runWithCwd(options.dest, blueprint.postInstall, data, options);
}

function destroy(options) {
  var templateFiles = _path2.default.join(options.src, 'files');
  var blueprint = blueprintFor(options.src);
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
    runWithCwd(options.dest, blueprint.postUninstall, data, options);
  });
}

function blueprintFor(srcpath) {
  var blueprint = require(_path2.default.join(srcpath, 'index.js'));
  blueprint.locals = blueprint.locals || function () {
    return {};
  };
  blueprint.postInstall = blueprint.postInstall || function () {};
  blueprint.postUninstall = blueprint.postInstall || function () {};
  return blueprint;
}

function runWithCwd(cwd, fn) {
  var originalCwd = process.cwd();
  process.chdir(cwd);

  for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  fn.apply(undefined, args);
  process.chdir(originalCwd);
}