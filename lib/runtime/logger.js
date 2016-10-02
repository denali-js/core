import chalk from 'chalk';
import identity from 'lodash/identity';
import padStart from 'lodash/padStart';

/**
 * A simple Logger class that adds timestamps and supports multiple levels of
 * logging, colorized output, and control over verbosity.
 *
 * @class Logger
 * @static
 * @module denali
 * @submodule runtime
 */
export default class Logger {

  loglevel = 'debug';

  colorize = true;

  levels = [
    'debug',
    'info',
    'warn',
    'error'
  ];

  colors = {
    debug: chalk.cyan,
    info: chalk.white,
    warn: chalk.yellow,
    error: chalk.red
  };

  debug(msg) {
    this.log('debug', msg);
  }

  info(msg) {
    this.log('info', msg);
  }

  warn(msg) {
    this.log('warn', msg);
  }

  error(msg) {
    this.log('error', msg);
  }

  log(level, msg) {
    if (!this.levels.includes(level)) {
      level = 'info';
    }
    let timestamp = (new Date()).toISOString();
    let padLength = this.levels.reduce((n, label) => Math.max(n, label.length));
    let levelLabel = padStart(level.toUpperCase(), padLength);
    if (this.colorize) {
      let colorizer = this.colors[level] || identity;
      msg = colorizer(msg);
      levelLabel = colorizer(levelLabel);
    }
    /* eslint-disable no-console */
    console.log(`[${ timestamp }] ${ levelLabel } - ${ msg }`);
    /* eslint-enable no-console */
  }

}
