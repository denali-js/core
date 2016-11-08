import path from 'path';
import findup from 'findup-sync';
import assign from 'lodash/assign';
import MockRequest from './mock-request';
import MockResponse from './mock-response';

export default class AppAcceptanceTest {

  constructor() {
    // When testing apps, use app/application as the base application instance;
    // but when testing addons, use the dummy app (test/dummy) as the base
    // application
    let addons = [];
    // Once avajs/ava#1074 is released, process.cwd() will the actual project
    // root. So we can simply use process.cwd() instead.
    let compiledPath = path.dirname(findup('package.json'));

    let Application = require(path.join(compiledPath, 'app/application')).default;
    let environment = process.env.DENALI_ENV || process.env.NODE_ENV || 'test';
    this.application = new Application({
      environment,
      addons,
      dir: compiledPath
    });
    this.initializers = this.application.runInitializers();
  }

  _injections = {};

  headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };

  request(options = {}) {
    let body = null;
    if (options.body) {
      body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      options.headers = options.headers || {};
      options.headers['Transfer-Encoding'] = 'chunked';
    }
    let req = new MockRequest({
      method: options.method,
      url: options.url,
      headers: assign({}, this.headers, options.headers)
    });

    return this.initializers.then(() => {
      return new Promise((resolve, reject) => {
        let res = new MockResponse(() => {
          let resBody = res._getString();
          if (res.statusCode < 500) {
            try {
              resBody = res._getJSON();
            } catch (e) {} // eslint-disable-line no-empty
            resolve({ status: res.statusCode, body: resBody });
          } else {
            resBody = resBody.replace(/\\n/g, '\n');
            reject(new Error(`Request failed - ${ req.method.toUpperCase() } ${ req.url } returned a ${ res.statusCode }:\n${ resBody }`));
          }
        });

        this.application.router.handle(req, res);

        setTimeout(() => {
          if (body) {
            req.write(body);
          }
          req.end();
        }, 10);
      });
    });
  }

  get(url, options = {}) {
    return this.request(Object.assign(options, { url, method: 'get' }));
  }
  head(url, options = {}) {
    return this.request(Object.assign(options, { url, method: 'head' }));
  }
  delete(url, options = {}) {
    return this.request(Object.assign(options, { url, method: 'delete' }));
  }
  post(url, body, options = {}) {
    return this.request(Object.assign(options, { url, body, method: 'post' }));
  }
  put(url, body, options = {}) {
    return this.request(Object.assign(options, { url, body, method: 'put' }));
  }
  patch(url, body, options = {}) {
    return this.request(Object.assign(options, { url, body, method: 'patch' }));
  }

  getHeader(name) {
    return this.headers[name];
  }

  setHeader(name, value) {
    this.headers[name] = value;
  }

  removeHeader(name) {
    delete this.headers[name];
  }

  lookup() {
    return this.application.container.lookup(...arguments);
  }

  inject(name, value) {
    this._injections[name] = this.application.container.lookup(name);
    this.application.container.register(name, value);
  }

  restore(name) {
    this.application.container.register(name, this._injections[name]);
    delete this._injections[name];
  }

}
