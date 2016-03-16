/**
 * @module denali
 * @submodule testing
 */
import assert from 'assert';
import state from './global-state';

/**
 * Proxy to the current testing application's container lookup method.
 *
 * @method lookup
 * @return {any}
 * @for Denali.Testing.helpers
 */
export default function lookup() {
  assert(state.application, 'No active application found. You must call `createApplication()` before `lookup()`.');
  return state.application.container.lookup(...arguments);
}
