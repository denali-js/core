'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = request;

var _defaults = require('lodash/object/defaults');

var _defaults2 = _interopRequireDefault(_defaults);

var _forOwn = require('lodash/object/forOwn');

var _forOwn2 = _interopRequireDefault(_forOwn);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function request(method, url) {
  var _this = this;

  var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  this.headers = this.headers || {};
  var req = this.server[method](url);
  options = (0, _defaults2.default)(options, { headers: this.headers });
  if (options.headers) {
    (0, _forOwn2.default)(options.headers, function (value, key) {
      req.set(key, value);
    });
  }
  req = req.set('Accept', 'application/vnd.api+json');
  if (options.body) {
    req = req.send(JSON.stringify(options.body));
  }
  return req.toPromise().then(function (response) {
    _this.response = response;
    return response;
  }).catch(function (err) {
    _this.response = err.response;
    return Promise.reject(err);
  });
}