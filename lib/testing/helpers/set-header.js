/**
 * @module denali
 * @submodule testing
 */
const state = require('./global-state');

module.exports = function setHeader(name, value) {
  state.headers = state.headers || {};
  state.headers[name] = value;
};
