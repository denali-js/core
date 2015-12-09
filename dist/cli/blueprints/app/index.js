'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _child_process = require('child_process');

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  locals: function locals(args) {
    return {
      name: args[0]
    };
  },
  postInstall: function postInstall(_ref) {
    var name = _ref.name;

    console.log('');
    console.log(_chalk2.default.green('Installing npm dependencies ...'));
    (0, _child_process.execSync)('npm install --loglevel=error');
    console.log(_chalk2.default.green('Setting up git repo ...'));
    (0, _child_process.execSync)('git init');
    (0, _child_process.execSync)('git add .');
    (0, _child_process.execSync)('git commit -am "Initial denali project scaffold"');
    console.log('');
    console.log('');
    console.log(_chalk2.default.green.bold('Installation complete!'));
    console.log('To launch your application, just run:');
    console.log('');
    console.log('  $ cd ' + name + ' && denali server');
    console.log('');
  }
};