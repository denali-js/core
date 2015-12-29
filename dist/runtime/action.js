'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _object = require('./object');

var _object2 = _interopRequireDefault(_object);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _assign = require('lodash/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _capitalize = require('lodash/string/capitalize');

var _capitalize2 = _interopRequireDefault(_capitalize);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _object2.default.extend({
  render: function render() {
    var _response;

    this._rendered = true;
    return (_response = this.response).render.apply(_response, arguments);
  },
  run: function run() {
    var _this = this;

    var params = (0, _assign2.default)({}, this.request.query, this.request.body);
    var responder = this.respond;
    (0, _assert2.default)(typeof responder === 'function', 'Your \'' + this.name + '\' must define a respond method!');
    if (this.request.get('accept') !== '*/*') {
      var availableFormats = [];
      /* eslint-disable guard-for-in */
      for (var key in this) {
        if (/^respondWith/.test(key)) {
          var format = key.match(/respondWith(.+)/)[1].toLowerCase();
          availableFormats.push(format);
        }
      }
      /* eslint-enable guard-for-in */
      if (availableFormats.length > 0) {
        var bestFormat = this.request.accepts(availableFormats);
        if (bestFormat) {
          responder = this['respondWith' + (0, _capitalize2.default)(bestFormat)];
        }
      }
    }
    responder = _bluebird2.default.method(responder.bind(this));
    return responder(params).then(function () {
      if (!(_this._rendered || _this.response.headersSent)) {
        _this.next('You failed to finish your request. This is most likely caused by either failing to call `this.render()`, failing to return the promise which will eventually call `this.render()`, or failing to call this.response.send/json/etc');
      }
    }).catch(function (error) {
      _this.next(error);
    });
  },
  log: function log(level) {
    var _application;

    for (var _len = arguments.length, msg = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      msg[_key - 1] = arguments[_key];
    }

    return (_application = this.application).log.apply(_application, [level, '[action:' + this.name + ']'].concat(msg));
  }
});
module.exports = exports['default'];