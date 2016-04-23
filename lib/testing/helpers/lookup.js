/**
 * @module denali
 * @submodule testing
 */
const assert = require('assert');
const state = require('./global-state');

/**
 * Proxy to the current testing application's container lookup method.
 *
 * @method lookup
 * @return {any}
 * @for Denali.Testing.helpers
 */
module.exports = function lookup(...args) {
  assert(state.application, 'No active application found. You must call `createApplication()` before `lookup()`.');
  return state.application.container.lookup(...args);
};
