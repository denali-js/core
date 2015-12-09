'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _inflection = require('inflection');

exports.default = {
  locals: function locals(args) {
    return {
      name: (0, _inflection.singularize)(args[0]),
      pluralName: (0, _inflection.pluralize)(args[0])
    };
  }
};