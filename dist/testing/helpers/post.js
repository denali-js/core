'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = post;
function post(url, body) {
  var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  options.body = body;
  return this.request('post', url, options);
}
module.exports = exports['default'];