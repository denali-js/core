'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _denali = require('denali');

exports.default = _denali.Controller.extend({
  filters: function filters() {
    // this.before('someActionName');
  },
  list: function list(req, res) {
    res.render(new _denali.Errors.NotImplemented());
  },
  create: function create(req, res) {
    res.render(new _denali.Errors.NotImplemented());
  },
  show: function show(req, res) {
    res.render(new _denali.Errors.NotImplemented());
  },
  update: function update(req, res) {
    res.render(new _denali.Errors.NotImplemented());
  },
  destroy: function destroy(req, res) {
    res.render(new _denali.Errors.NotImplemented());
  }
});