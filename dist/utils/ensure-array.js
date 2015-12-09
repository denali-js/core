'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ensureArray;

var _isArray = require('lodash/lang/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Takes the provided argument and ensures that the return value is an array.
 * If it is already an array, it is returned as-is. If is null or undefined,
 * an empty array is returned. Otherwise, it wraps the argument in an array
 * and returns that array.
 *
 * @method ensureArray
 *
 * @param  {any} value
 *
 * @return {Array}
 */
function ensureArray(value) {
  if ((0, _isArray2.default)(value)) {
    return value;
  } else if (value != null) {
    return [value];
  } else {
    return [];
  }
}