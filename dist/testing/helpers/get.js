'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = get;
function get(url, options) {
  return this.request('get', url, options);
};
module.exports = exports['default'];