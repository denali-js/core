"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = setHeader;
function setHeader(name, value) {
  this.headers = this.headers || {};
  return this.headers[name] = value;
}
module.exports = exports['default'];