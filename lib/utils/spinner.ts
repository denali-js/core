import ora = require('ora');

let spinner = ora({ stream: process.stdout });

export default {

  start(msg: string): void {
    spinner.text = msg;
    spinner.start();
  },

  succeed(msg?: string): void {
    spinner.text = msg || spinner.text;
    spinner.succeed();
  },

  fail(msg?: string): void {
    spinner.text = msg || spinner.text;
    (<any>spinner).stream = process.stderr;
    spinner.fail();
    (<any>spinner).stream = process.stdout;
  },

  finish(symbol: string, text: string): void {
    (<(options: Object) => void>spinner.stopAndPersist)({ symbol, text });
  }

};
