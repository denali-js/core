import Promise from 'bluebird';
import merge from 'lodash/object/merge';
import forEach from 'lodash/collection/forEach';
import state from './global-state';

export default function sendRequest(method, url, options = {}) {
  return new Promise((resolve, reject) => {
    let request = state.server[method](url);

    let headers = merge({}, state.headers, options.headers);
    forEach(headers, (value, name) => {
      request = request.set(name, value);
    });

    if (options.data) {
      request = request.send(JSON.stringify(options.data));
    }

    request.end((err, response) => {
      if (err) {
        return reject(err);
      }
      if (response.statusCode >= 500) {
        let errorBody = JSON.parse(response.error.text);
        return reject(errorBody);
      }
      resolve(response);
    });

  });
}
