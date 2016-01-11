import assert from 'assert';
import state from './global-state';

export default function lookup() {
  assert(state.application, 'No active application found. You must call `createApplication()` before `lookup()`.');
  return state.application.container.lookup(...arguments);
}
