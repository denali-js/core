'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createServer;

var _supertestAsPromised = require('supertest-as-promised');

var _supertestAsPromised2 = _interopRequireDefault(_supertestAsPromised);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createServer() {
  var _this = this;

  var Application = require('../../runtime/application');
  var application = new Application({ rootDir: process.cwd(), environment: 'test' });
  application.start().then(function () {
    _this.server = (0, _supertestAsPromised2.default)(application.server);
    _this.app = application;
  });
}
module.exports = exports['default'];