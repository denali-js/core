import chalk from 'chalk';

const prefixColors = {
  info: 'blue',
  warn: 'yellow',
  error: 'red'
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
export default function log(level, msg) {
  if (!msg) {
    msg = level;
    level = 'info';
  }
  level = level.toLowerCase();
  let prefixColor = prefixColors[level];
  let parts = [];
  parts.push((new Date()).toISOString());
  parts.push(chalk[prefixColor]('[' + level.toUpperCase() + ']'));
  parts.push(msg);
  console.log(parts.join(' '));
}
