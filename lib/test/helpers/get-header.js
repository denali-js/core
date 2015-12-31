import state from './global-state';

export default function getHeader(name) {
  return state.headers[name];
}
