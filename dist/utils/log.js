import chalk from 'chalk';

const prefixColors = {
  info: chalk.blue,
  warn: chalk.yellow.bold,
  error: chalk.red.bold.underline
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
export default function log(level, ...msg) {;
  level = level.toLowerCase();
  let color = prefixColors[level];
  let parts = [];
  parts.push(color((new Date()).toISOString()));
  parts.push(color(`[${ level.toUpperCase() }]`));
  parts.push(...msg.map((m) => { return m.toString(); }));
  console.log(parts.join(' '));
}
