'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = log;

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var prefixColors = {
  info: _chalk2.default.blue,
  warn: _chalk2.default.yellow.bold,
  error: _chalk2.default.red.bold.underline
};

/**
 * A simple console logging method that adds a timestamp, optional log level,
 * and some color to the output.
 *
 * @method log
 *
 * @param  {String} level The log level; must be either 'info', 'warn', 'error'
 * @param  {String} msg   The message to log
 */
function log(level) {
  ;
  level = level.toLowerCase();
  var color = prefixColors[level];
  var parts = [];
  parts.push(color(new Date().toISOString()));
  parts.push(color('[' + level.toUpperCase() + ']'));

  for (var _len = arguments.length, msg = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    msg[_key - 1] = arguments[_key];
  }

  parts.push.apply(parts, _toConsumableArray(msg.map(function (m) {
    return m.toString();
  })));
  console.log(parts.join(' '));
}
module.exports = exports['default'];