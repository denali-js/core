"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getHeader;
function getHeader(name) {
  return this.headers[name];
}