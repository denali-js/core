'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _child_process = require('child_process');

var _assign = require('lodash/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _remove = require('lodash/array/remove');

var _remove2 = _interopRequireDefault(_remove);

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _denaliApp = require('../broccoli/denali-app');

var _denaliApp2 = _interopRequireDefault(_denaliApp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var children = [];

_commander2.default.option('-e --environment <environment>', 'The environment to run in; defaults to "test"', 'test').option('-d --debug', 'Runs the server with the node --debug flag, and launches node-inspector').option('-w --watch', 'Watches the source files and restarts the server on changes (enabled by default in development)').option('-p, --port <port>', 'Sets the port that the server will listen on').option('-g --grep <regex filter>', 'Filter tests based on a regex pattern').parse(process.argv);

var environment = _commander2.default.environment || process.env.NODE_ENV || process.env.DENALI_ENV || 'test';

var command = 'mocha';
var args = [];
var options = {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: (0, _assign2.default)({
    DENALI_ENV: _commander2.default.environment,
    PORT: _commander2.default.port
  }, process.env)
};

if (_commander2.default.grep) {
  args.push('--grep');
  args.push(_commander2.default.grep);
}

if (_commander2.default.debug) {
  args.unshift('--debug-brk');
  children.push((0, _child_process.exec)('node-inspector'));
  console.log('Starting in debug mode. You can access the debugger at http://127.0.0.1:8080/?port=5858');
}

var server = undefined;

process.on('SIGINT', function () {
  var quit = after(children.length, process.exit.bind(process));
  children.forEach(function (child) {
    child.kill();
    child.once('exit', quit);
  });
});

var buildFile = require('./denali-build.js');

var App = _denaliApp2.default.extend(buildFile);

var app = new App({
  src: process.cwd(),
  environment: environment,
  watch: _commander2.default.watch,
  afterBuild: function afterBuild(destDir) {
    if (server) {
      (function () {
        var oldServer = server;
        oldServer.kill();
        oldServer.once('exit', function () {
          (0, _remove2.default)(children, oldServer);
        });
      })();
    }
    var instanceArgs = args.slice(0);
    instanceArgs.push(_path2.default.join(destDir));
    server = (0, _child_process.spawn)(command, instanceArgs, options);
    children.push(server);
    if (_commander2.default.watch) {
      server.on('exit', function (code) {
        console.log(_chalk2.default.red.bold('Server ' + (code ? 'exited' : 'crashed') + '! Waiting for changes to restart ...'));
      });
    }
  }
});

app.build('dist');