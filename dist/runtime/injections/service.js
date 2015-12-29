'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = injectService;
var injectionFlag = Symbol.for('denali:injection-flag');

function injectService(serviceName) {
  return {
    _injection: injectionFlag,
    type: 'services',
    value: serviceName
  };
}
module.exports = exports['default'];