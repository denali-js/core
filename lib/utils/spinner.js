import ora from 'ora';

let spinner = ora();

export default {
  start(msg) {
    spinner.text = msg;
    spinner.start();
  },
  succeed(msg) {
    spinner.text = msg;
    spinner.succeed();
  },
  fail(msg) {
    spinner.text = msg;
    spinner.fail();
  }
};
