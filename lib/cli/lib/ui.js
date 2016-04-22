const chalk = require('chalk');

const loglevels = [
  'debug',
  'info',
  'warn',
  'error'
];

module.exports = {
  loglevel: 'debug',
  raw(level, output) {
    if (loglevels.indexOf(this.loglevel) <= loglevels.indexOf(level)) {
      process.stdout.write(output);
    }
  },
  debug(...msgs) {
    if (loglevels.indexOf(this.loglevel) <= loglevels.indexOf('debug')) {
      msgs = msgs.map((msg) => chalk.cyan(msg));
      console.log(...msgs);
    }
  },
  info(...msgs) {
    if (loglevels.indexOf(this.loglevel) <= loglevels.indexOf('info')) {
      console.log(...msgs);
    }
  },
  warn(...msgs) {
    if (loglevels.indexOf(this.loglevel) <= loglevels.indexOf('warn')) {
      msgs = msgs.map((msg) => chalk.yellow(msg));
      console.warn(...msgs);
    }
  },
  error(...msgs) {
    if (loglevels.indexOf(this.loglevel) <= loglevels.indexOf('error')) {
      msgs = msgs.map((msg) => chalk.red(msg));
      console.error(...msgs);
    }
  }
};
