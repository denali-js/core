import path from 'path';
import chalk from 'chalk';
import { spawn } from 'child_process';
import nsp from 'nsp';
import program from 'commander';
import DenaliAppTest from '../broccoli/denali-app-test';
import rimraf from 'rimraf';
import tryRequire from '../../utils/try-require';
import { sync as copyDereferenceSync } from 'copy-dereference';

program
  .usage('[options] <additional test files...>')
  .description('Run your tests. Automatically runs test/integration and test/unit, and any additional files you included in the command.')
  .option('-e --environment <environment>', 'The environment to run in; defaults to "test"', 'test')
  .option('-d --debug', 'Runs the server with the node --debug flag, and launches node-inspector')
  .option('-w --watch', 'Watches the source files and restarts the server on changes (enabled by default in development)')
  .option('-p, --port <port>', 'Sets the port that the server will listen on')
  .option('-g --grep <regex filter>', 'Filter tests based on a regex pattern')
  .parse(process.argv);

let environment = program.environment || process.env.NODE_ENV || process.env.DENALI_ENV || 'test';
let destDir = path.join(process.cwd(), 'dist');

let command = 'mocha';
let args = [ 'test/*.js', 'test/integration/**/*.js', 'test/unit/**/*.js' ];
let options = {
  stdio: [ 'pipe', process.stdout, process.stderr ],
  cwd: destDir
};

if (program.grep) {
  args.push('--grep');
  args.push(program.grep);
}

if (program.debug) {
  args.unshift('--debug-brk');
  let inspector = spawn(path.join('node_modules', '.bin', 'node-inspector'), [ '--web-port', '4000' ]);
  inspector.on('error', function(error) {
    if (error.code === 'ENOENT') {
      console.error(chalk.red('Unable to start in debug mode: node-inspector not found. Run `npm install -D node-inspector` and try again.'));
      process.exit(1);
    }
    throw error;
  });
  console.log('Starting in debug mode. You can access the debugger at http://127.0.0.1:4000/?port=5858');
}

let server;

let buildFile = tryRequire(path.join(process.cwd(), './denali-build.js')) || {};

const App = DenaliAppTest.extend(buildFile);

let app = new App({
  src: process.cwd(),
  environment,
  watch: program.watch,
  pkg: require(path.join(process.cwd(), 'package.json')),
  afterBuild(outputDir) {
    rimraf(destDir, (err) => {
      if (err) {
        return console.log(chalk.red.bold(err.stack || err));
      }
      copyDereferenceSync(outputDir, destDir);
      if (server) {
        let oldServer = server;
        oldServer.removeAllListeners('exit');
        oldServer.kill();
      }
      server = spawn(command, args, options);
      if (program.watch) {
        server.on('exit', (code) => {
          console.log(chalk.red.bold(`Tests ${ code === 0 ? 'finished' : 'failed' }! Waiting for changes to rerun ...`));
        });
      }
    });
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

app.build('dist');
