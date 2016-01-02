import state from './global-state';

export default function removeHeader(name) {
  delete state.headers[name];
}
