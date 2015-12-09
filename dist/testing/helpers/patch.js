'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = patch;
function patch(url, body) {
  var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  options.body = body;
  return this.request('patch', url, options);
}