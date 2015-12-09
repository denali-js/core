"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = removeHeader;
function removeHeader(name) {
  return delete this.headers[name];
}