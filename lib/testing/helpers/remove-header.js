/**
 * @module denali
 * @submodule testing
 */
import state from './global-state';

/**
 * Remove a header from the global testing state
 *
 * @method removeHeader
 * @param name {String} the name of the header (case-sensitive) to remove
 * @for Testing.helpers
 */
export default function removeHeader(name) {
  delete state.headers[name];
}
