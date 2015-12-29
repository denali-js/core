import path from 'path';
import chalk from 'chalk';
import { spawn } from 'child_process';
import program from 'commander';
import nsp from 'nsp';
import DenaliApp from '../broccoli/denali-app';
import tryRequire from '../../utils/try-require';
import rimraf from 'rimraf';
import { sync as copyDereferenceSync } from 'copy-dereference';

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

program
.option('-e --environment <environment>', 'The environment to run under, i.e. "production"', String)
.option('-d --debug', 'Runs the server with the node --debug flag, and launches node-inspector')
.option('-w --watch', 'Watches the source files and restarts the server on changes (enabled by default in development)')
.option('-p, --port <port>', 'Sets the port that the server will listen on')
.parse(process.argv);

let environment = program.environment || process.env.NODE_ENV || process.env.DENALI_ENV || 'development';
let watch = environment === 'development' || program.watch;

let command = 'node';
let args = [ 'node_modules/denali/dist/bootstrap.js', path.join(process.cwd(), 'dist') ];
let options = {
  stdio: [ 'pipe', process.stdout, process.stderr ],
  cwd: process.cwd()
};
let destDir = path.join(process.cwd(), 'dist');

if (program.debug) {
  args.unshift('--debug-brk');
  console.log('Starting in debug mode. You can access the debugger at http://127.0.0.1:8080/?port=5858');
}

let server;

let buildFile = tryRequire(path.join(process.cwd(), './denali-build.js')) || {};

const App = DenaliApp.extend(buildFile);

let app = new App({
  src: process.cwd(),
  environment,
  watch,
  pkg: require(path.join(process.cwd(), 'package.json')),
  afterBuild(outputDir) {
    rimraf.sync(destDir);
    copyDereferenceSync(outputDir, destDir);
    if (server) {
      let oldServer = server;
      oldServer.removeAllListeners('exit');
      oldServer.kill();
    }
    server = spawn(command, args, options);
    if (watch) {
      server.on('exit', (code) => {
        console.log(chalk.red.bold(`Server ${ code === 0 ? 'exited' : 'crashed' }! Waiting for changes to restart ...`));
      });
    }
  }
});

nsp.check({ 'package': path.join(process.cwd(), 'package.json') }, function(err, results) {
  if (err && [ 'ENOTFOUND', 'ECONNRESET' ].indexOf(err.code) > -1) {
    console.log(chalk.bold.yellow('Error trying to scan package dependencies for vulnerabilities with nsp, skipping scan ...'));
    console.log(err);
  }
  if (results && results.length > 0) {
    console.log(chalk.red.bold('Vulnerable dependencies found:'));
    results.forEach((result) => {
      console.log(result);
    });
    return;
  }
});

app.build();
