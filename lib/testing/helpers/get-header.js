/**
 * @module denali
 * @submodule testing
 */
const state = require('./global-state');

/**
 * Read a header from the global testing state
 *
 * @method getHeader
 * @param name {String} the name of the header (case-sensitive) to return
 * @return {String} the header value
 * @for Denali.Testing.helpers
 */
module.exports = function getHeader(name) {
  return state.headers[name];
};
