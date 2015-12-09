'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = del;
function del(url, options) {
  return this.request('delete', url, options);
}