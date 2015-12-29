'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _coreObject = require('core-object');

var _coreObject2 = _interopRequireDefault(_coreObject);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _mapValues = require('lodash/object/mapValues');

var _mapValues2 = _interopRequireDefault(_mapValues);

var _assign = require('lodash/object/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function findInjections(object, fn) {
  return (0, _mapValues2.default)(object, function (value, key) {
    if (value._injection === Symbol.for('denali:injection-flag')) {
      return fn(value, key);
    }
    return value;
  });
}

var DenaliObject = _coreObject2.default.extend({
  init: function init() {
    var _this = this;

    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    findInjections(options, function (injection, key) {
      (0, _assert2.default)(options.container, 'You must supply a container to any DenaliObject with injections.');
      _this[key] = options.container.lookup(injection.type, injection.name || key);
    });
    this.constructor._injections.forEach(function (_ref) {
      var injection = _ref.injection;
      var key = _ref.key;

      (0, _assert2.default)(options.container, 'You must supply a container to any DenaliObject with injections.');
      _this[key] = options.container.lookup({ type: injection.type, name: injection.name || key });
    });
    if (options.container) {
      this.config = options.config || options.container.lookup('config/environment');
    }
    this._super.apply(this, arguments);
  }
});

DenaliObject._injections = [];

var coreObjectExtend = _coreObject2.default.extend;
DenaliObject.extend = function extendWithMixins() {
  var Class = this;

  for (var _len = arguments.length, mixins = Array(_len), _key = 0; _key < _len; _key++) {
    mixins[_key] = arguments[_key];
  }

  mixins.forEach(function (mixin) {
    if (typeof mixin === 'function') {
      mixin = mixin.prototype;
    }
    var NewClass = coreObjectExtend.call(Class, mixin);
    (0, _assign2.default)(NewClass, Class);
    NewClass.prototype.constructor = NewClass;
    // Pulling injections on the constructor during design-time helps optimize
    // object creation. This way, we don't have to recurse over *all* (including
    // prototype) properties of the newly created instance to inject the
    // service. Instead, we compile the list of necessary injections only once,
    // during design-time, and then we only need to iterate over that list at
    // run-time.
    NewClass._injections = Class._injections.slice(0);
    findInjections(mixin, function (injection, key) {
      NewClass._injections.push({ injection: injection, key: key });
    });
    NewClass.extend = extendWithMixins;
    Class = NewClass;
  });
  return Class;
};

exports.default = DenaliObject;
module.exports = exports['default'];