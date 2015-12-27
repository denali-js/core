import path from 'path';
import chalk from 'chalk';
import { exec, spawn } from 'child_process';
import assign from 'lodash/object/assign';
import remove from 'lodash/array/remove';
import program from 'commander';
import DenaliApp from '../broccoli/denali-app';

let children = [];

program
  .option('-e --environment <environment>', 'The environment to run in; defaults to "test"', 'test')
  .option('-d --debug', 'Runs the server with the node --debug flag, and launches node-inspector')
  .option('-w --watch', 'Watches the source files and restarts the server on changes (enabled by default in development)')
  .option('-p, --port <port>', 'Sets the port that the server will listen on')
  .option('-g --grep <regex filter>', 'Filter tests based on a regex pattern')
  .parse(process.argv);

let environment = program.environment || process.env.NODE_ENV || process.env.DENALI_ENV || 'test';

let command = 'mocha';
let args = [];
let options = {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: assign({
    DENALI_ENV: program.environment,
    PORT: program.port
  }, process.env)
};

if (program.grep) {
  args.push('--grep');
  args.push(program.grep);
}

if (program.debug) {
  args.unshift('--debug-brk');
  children.push(exec('node-inspector'));
  console.log('Starting in debug mode. You can access the debugger at http://127.0.0.1:8080/?port=5858');
}

let server;

process.on('SIGINT', () => {
  let quit = after(children.length, process.exit.bind(process));
  children.forEach((child) => {
    child.kill();
    child.once('exit', quit);
  });
});

let buildFile = require('./denali-build.js');

const App = DenaliApp.extend(buildFile);

let app = new App({
  src: process.cwd(),
  environment,
  watch: program.watch,
  afterBuild(destDir) {
    if (server) {
      let oldServer = server;
      oldServer.kill();
      oldServer.once('exit', () => { remove(children, oldServer); });
    }
    let instanceArgs = args.slice(0);
    instanceArgs.push(path.join(destDir));
    server = spawn(command, instanceArgs, options);
    children.push(server);
    if (program.watch) {
      server.on('exit', (code) => {
        console.log(chalk.red.bold(`Server ${ code ? 'exited' : 'crashed' }! Waiting for changes to restart ...`));
      });
    }
  }
});

app.build('dist');
