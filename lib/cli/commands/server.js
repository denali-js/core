import path from 'path';
import chalk from 'chalk';
import { exec, spawn } from 'child_process';
import assign from 'lodash/object/assign';
import remove from 'lodash/array/remove';
import program from 'commander';
import DenaliApp from '../broccoli/denali-app';

/**
 * The server command is responsible for launching the Denali app. It will
 * compile the app via broccoli and run the result.
 *
 * The app itself is launched as a child process. The app is started by reaching
 * into it's installation of denali (inside node_modules/denali) and running the
 * bootstrap.js script.
 *
 * This script then loads the compiled app (whose location is specified by the
 * server command process as an arg to the bootstrap script). From there, an
 * Application is instantiated and the runtime takes over.
 */

let children = [];

program
.option('-e --environment <environment>', 'The environment to run under, i.e. "production"', String)
.option('-d --debug', 'Runs the server with the node --debug flag, and launches node-inspector')
.option('-w --watch', 'Watches the source files and restarts the server on changes (enabled by default in development)')
.option('-p, --port <port>', 'Sets the port that the server will listen on')
.parse(process.argv);

let environment = program.environment || process.env.NODE_ENV || process.env.DENALI_ENV || 'development';
let watch = environment === 'development' || program.watch;

let command = 'node';
let args = [ 'node_modules/denali/dist/bootstrap.js' ];
let options = {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: assign({
    DENALI_ENV: program.environment,
    PORT: program.port
  }, process.env)
};

if (program.debug) {
  args.unshift('--debug-brk');
  children.push(exec('node-inspector'));
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
  watch,
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
    if (watch) {
      server.on('exit', (code) => {
        console.log(chalk.red.bold(`Server ${ code ? 'exited' : 'crashed' }! Waiting for changes to restart ...`));
      });
    }
  }
});

app.build('dist');
