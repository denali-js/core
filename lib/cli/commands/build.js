import path from 'path';
import chalk from 'chalk';
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
.usage('[options]')
.description('Build your app or addon for local or production use')
.option('-e --environment <environment>', 'The environment to run under, i.e. "production"', String)
.parse(process.argv);

let environment = program.environment || process.env.NODE_ENV || process.env.DENALI_ENV || 'development';
let destDir = path.join(process.cwd(), 'dist');
let buildFile = tryRequire(path.join(process.cwd(), './denali-build.js')) || {};

const App = DenaliApp.extend(buildFile);

let app = new App({
  src: process.cwd(),
  environment,
  pkg: require(path.join(process.cwd(), 'package.json')),
  afterBuild(outputDir) {
    rimraf.sync(destDir);
    copyDereferenceSync(outputDir, destDir);
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
