'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _child_process = require('child_process');

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _nsp = require('nsp');

var _nsp2 = _interopRequireDefault(_nsp);

var _denaliApp = require('../broccoli/denali-app');

var _denaliApp2 = _interopRequireDefault(_denaliApp);

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _copyDereference = require('copy-dereference');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

_commander2.default.option('-e --environment <environment>', 'The environment to run under, i.e. "production"', String).option('-d --debug', 'Runs the server with the node --debug flag, and launches node-inspector').option('-w --watch', 'Watches the source files and restarts the server on changes (enabled by default in development)').option('-p, --port <port>', 'Sets the port that the server will listen on').parse(process.argv);

var environment = _commander2.default.environment || process.env.NODE_ENV || process.env.DENALI_ENV || 'development';
var watch = environment === 'development' || _commander2.default.watch;

var command = 'node';
var args = ['node_modules/denali/dist/bootstrap.js', _path2.default.join(process.cwd(), 'dist')];
var options = {
  stdio: ['pipe', process.stdout, process.stderr],
  cwd: process.cwd()
};
var destDir = _path2.default.join(process.cwd(), 'dist');

if (_commander2.default.debug) {
  args.unshift('--debug-brk');
  console.log('Starting in debug mode. You can access the debugger at http://127.0.0.1:8080/?port=5858');
}

var server = undefined;

var buildFile = require(_path2.default.join(process.cwd(), './denali-build.js'));

var App = _denaliApp2.default.extend(buildFile);

var app = new App({
  src: process.cwd(),
  environment: environment,
  watch: watch,
  pkg: require(_path2.default.join(process.cwd(), 'package.json')),
  afterBuild: function afterBuild(outputDir) {
    _rimraf2.default.sync(destDir);
    (0, _copyDereference.sync)(outputDir, destDir);
    if (server) {
      var oldServer = server;
      oldServer.removeAllListeners('exit');
      oldServer.kill();
    }
    server = (0, _child_process.spawn)(command, args, options);
    if (watch) {
      server.on('exit', function (code) {
        console.log(_chalk2.default.red.bold('Server ' + (code === 0 ? 'exited' : 'crashed') + '! Waiting for changes to restart ...'));
      });
    }
  }
});

_nsp2.default.check({ 'package': _path2.default.join(process.cwd(), 'package.json') }, function (err, results) {
  if (err && ['ENOTFOUND', 'ECONNRESET'].indexOf(err.code) > -1) {
    console.log(_chalk2.default.bold.yellow('Error trying to scan package dependencies for vulnerabilities with nsp, skipping scan ...'));
    console.log(err);
  }
  if (results && results.length > 0) {
    console.log(_chalk2.default.red.bold('Vulnerable dependencies found:'));
    results.forEach(function (result) {
      console.log(result);
    });
    return;
  }
});

app.build();