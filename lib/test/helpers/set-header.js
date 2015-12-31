import state from './global-state';

export default function setHeader(name, value) {
  state.headers = state.headers || {};
  state.headers[name] = value;
}
