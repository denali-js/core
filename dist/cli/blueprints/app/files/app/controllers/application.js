'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _denali = require('denali');

exports.default = _denali.Controller.extend({
  index: function index(req, res) {
    res.json({ denaliVersion: _denali.version, message: 'Welcome to Denali!' });
  }
});