'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = log;

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
function log(level, msg) {
  if (!msg) {
    msg = level;
    level = 'info';
  }
  level = level.toLowerCase();
  var color = prefixColors[level];
  var parts = [];
  parts.push(color(new Date().toISOString()));
  parts.push(color('[' + level.toUpperCase() + ']'));
  parts.push(msg);
  console.log(parts.join(' '));
}