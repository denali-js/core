const ora = require('ora');

let spinner = ora('');

module.exports = {
  start(msg) {
    spinner.text = msg;
    spinner.start();
  },
  succeed(msg) {
    spinner.text = msg || spinner.text;
    spinner.succeed();
  }
};