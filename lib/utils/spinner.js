import ora from 'ora';

let spinner = ora({ stream: process.stdout });

export default {
  start(msg) {
    spinner.text = msg;
    spinner.start();
  },
  succeed(msg) {
    spinner.text = msg || spinner.text;
    spinner.succeed();
  },
  fail(msg) {
    spinner.text = msg || spinner.text;
    spinner.stream = process.stderr;
    spinner.fail();
    spinner.stream = process.stdout;
  }
};
