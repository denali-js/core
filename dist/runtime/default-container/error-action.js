'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _action = require('../action');

var _action2 = _interopRequireDefault(_action);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _template = require('lodash/string/template');

var _template2 = _interopRequireDefault(_template);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var errorHTML = _fs2.default.readFileSync(_path2.default.join(__dirname, 'error-template.html'), 'utf-8');
var errorHTMLTemplate = (0, _template2.default)(errorHTML, { variable: 'error' });

exports.default = _action2.default.extend({
  respond: function respond() {
    try {
      return this.respondWithHTML();
    } catch (error) {
      this.log('error', 'Error encountered while rendering the error action response:');
      this.log('error', error.stack || error);
      this.log('error', 'Original error (from action:' + this.originalAction + '):');
      this.log('error', this.error.stack || this.error);
      if (!this.response.headersSent) {
        this.response.sendStatus(500);
      }
    }
  },
  respondWithHTML: function respondWithHTML() {
    return this.response.status(this.error.status || 500).send(errorHTMLTemplate(this.error));
  },
  respondWithJSON: function respondWithJSON() {
    return this.response.status(this.error.status || 500).json(this.error);
  }
});
module.exports = exports['default'];