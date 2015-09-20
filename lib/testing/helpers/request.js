import defaults from 'lodash-node/modern/object/defaults';
import forOwn from 'lodash-node/modern/object/forOwn';

export default function request(method, url, options = {}) {
  this.headers = this.headers || {};
  let req = this.server[method](url);
  options = defaults(options, { headers: this.headers });
  if (options.headers) {
    forOwn(options.headers, (value, key) => {
      req.set(key, value);
    });
  }
  req = req.set('Accept', 'application/vnd.api+json');
  if (options.body) {
    req = req.send(JSON.stringify(options.body));
  }
  return req.toPromise()
    .then((response) => {
      this.response = response;
      return response;
    }).catch((err) => {
      this.response = err.response;
      return Promise.reject(err);
    });
}
