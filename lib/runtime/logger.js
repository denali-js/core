const chalk = require('chalk');
const identity = require('lodash/identity');
const padStart = require('lodash/padStart');
const DenaliObject = require('../object');

module.exports = DenaliObject.extend({

  init(...args) {
    this._super(...args);

    this.levels = [
      'debug',
      'info',
      'warn',
      'error'
    ];

    this.colors = {
      debug: chalk.cyan,
      info: chalk.white,
      warn: chalk.yellow,
      error: chalk.red
    };
  },

  loglevel: 'debug',

  colorize: true,

  debug(msg) {
    this.log('debug', msg);
  },

  info(msg) {
    this.log('info', msg);
  },

  warn(msg) {
    this.log('warn', msg);
  },

  error(msg) {
    this.log('error', msg);
  },

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

});
