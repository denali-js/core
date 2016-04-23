/**
 * @module denali
 * @submodule testing
 */
const state = require('./global-state');

/**
 * Remove a header from the global testing state
 *
 * @method removeHeader
 * @param name {String} the name of the header (case-sensitive) to remove
 * @for Testing.helpers
 */
module.exports = function removeHeader(name) {
  delete state.headers[name];
};
