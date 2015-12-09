'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _assign = require('lodash/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _negate = require('lodash/function/negate');

var _negate2 = _interopRequireDefault(_negate);

var _pick = require('lodash/object/pick');

var _pick2 = _interopRequireDefault(_pick);

var _isEmpty = require('lodash/lang/isEmpty');

var _isEmpty2 = _interopRequireDefault(_isEmpty);

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _nodemon = require('nodemon');

var _nodemon2 = _interopRequireDefault(_nodemon);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_commander2.default.option('-e --environment <environment>', 'The environment to run under, i.e. "production"', String).option('-d --debug', 'Runs the server with the node --debug flag, and launches node-inspector').option('-p, --port <port>', 'Sets the port that the server will listen on').parse(process.argv);

var serverPath = _path2.default.join(process.cwd(), 'index.js');

if (_commander2.default.environment === 'development' || !_commander2.default.environment) {

  if (_commander2.default.debug) {
    _child_process2.default.exec('node-inspector');
    _child_process2.default.exec('open http://127.0.0.1:8080/debug?port=5858');
  }

  var env = process.env;
  env = (0, _assign2.default)({
    DENALI_ENV: _commander2.default.environment,
    PORT: _commander2.default.port
  }, env);
  env = (0, _pick2.default)(env, (0, _negate2.default)(_isEmpty2.default));

  (0, _nodemon2.default)({
    script: serverPath,
    ignore: ['node_modules\/(?!denali)', 'node_modules/denali/node_modules'],
    debug: _commander2.default.debug,
    env: env
  });

  _nodemon2.default.on('quit', function () {
    console.log('Goodbye!');
  });
  _nodemon2.default.on('restart', function (files) {
    console.log('\nFiles changed:\n  ' + files.join('\n  ') + '\nrestarting ...\n');
  });
  _nodemon2.default.on('crash', function () {
    console.log(_chalk2.default.red.bold('Server crashed! Waiting for file changes to restart ...'));
  });
} else {

  var spawnOptions = {
    stdio: 'inherit',
    env: (0, _assign2.default)({
      DENALI_ENV: _commander2.default.environment,
      PORT: _commander2.default.port
    }, process.env)
  };

  _child_process2.default.spawn('node', [serverPath], spawnOptions);
}