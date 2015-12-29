'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _object = require('./object');

var _object2 = _interopRequireDefault(_object);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _walkSync = require('walk-sync');

var _walkSync2 = _interopRequireDefault(_walkSync);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _assign = require('lodash/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _forEach = require('lodash/collection/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _find = require('lodash/collection/find');

var _find2 = _interopRequireDefault(_find);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

var JS_EXT = /\.js$/;

exports.default = _object2.default.extend({
  init: function init() {
    this._super.apply(this, arguments);
    this._registry = new Map();
    this._typeMaps = new Map();
    this._singletons = new Map();
    this._children = [];
  },
  addChildContainer: function addChildContainer(child) {
    this._children.push(child);
    child._parent = this;
  },
  register: function register(fullName, value) {
    var _parseFullName = this.parseFullName(fullName);

    var _parseFullName2 = _slicedToArray(_parseFullName, 2);

    var type = _parseFullName2[0];
    var name = _parseFullName2[1];

    if (!this._typeMaps.has(type)) {
      this._typeMaps.set(type, {});
    }
    this._typeMaps.get(type)[name] = value;
    this._registry.set(fullName, value);
  },
  registerDir: function registerDir(dirpath, typeName) {
    var _this = this;

    var paths = (0, _walkSync2.default)(dirpath);
    paths.forEach(function (filepath) {
      var absolutepath = _path2.default.join(dirpath, filepath);
      var moduleName = filepath.replace(JS_EXT, '');
      if (_fs2.default.statSync(absolutepath).isFile() && JS_EXT.test(absolutepath)) {
        _this.register(typeName + '/' + moduleName, require(absolutepath));
      }
    });
  },
  lookup: function lookup(fullName) {
    if (typeof fullName !== 'string') {
      fullName = this.compileFullName(fullName);
    }
    var result = this._registry.get(fullName);
    if (!result) {
      (0, _find2.default)(this._children, function (child) {
        var childResult = child.lookup(fullName);
        result = childResult || result;
        return childResult;
      });
    }
    if (result && result._instantiate) {
      if (result._singleton) {
        if (!this._singletons.get(fullName)) {
          this._singletons.set(fullName, new result({ container: this }));
        }
        return this._singletons.get(fullName);
      }
      return new result({ container: this });
    }
    return result;
  },
  lookupType: function lookupType(type) {
    var _this2 = this;

    var result = {};
    (0, _forEach2.default)(this._typeMaps.get(type), function (value, name) {
      var fullName = _this2.compileFullName({ type: type, name: name });
      result[name] = _this2.lookup(fullName);
    });
    this._children.forEach(function (child) {
      (0, _assign2.default)(result, child.lookupType(type));
    });
    return result;
  },
  parseFullName: function parseFullName(fullName) {
    var _fullName$split = fullName.split('/');

    var _fullName$split2 = _toArray(_fullName$split);

    var type = _fullName$split2[0];

    var name = _fullName$split2.slice(1);

    return [type, name.join('/')];
  },
  compileFullName: function compileFullName(_ref) {
    var type = _ref.type;
    var name = _ref.name;

    return type + '/' + name;
  }
});
module.exports = exports['default'];