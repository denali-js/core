import test from 'ava';
import path from 'path';
import assign from 'lodash/assign';
import MockRequest from './mock-request';
import MockResponse from './mock-response';

export class AcceptanceTestApp {

  constructor() {
    // When testing apps, use app/application as the base application instance;
    // but when testing addons, use the dummy app (test/dummy) as the base
    // application
    let applicationRoot;
    let addons = [];
    let pkg = require('package.json');
    if (pkg.keywords.includes('denali-addon')) {
      applicationRoot = path.join(process.cwd(), 'test/dummy');
      addons.push(process.cwd());
    } else {
      applicationRoot = process.cwd();
    }

    let Application = require(path.join(applicationRoot, 'app/application')).default;
    let environment = process.env.DENALI_ENV || process.env.NODE_ENV || 'test';
    this.application = new Application({
      environment,
      addons,
      dir: applicationRoot
    });
  }

  _injections = {};

  headers = {
    Accept: 'application/json'
  };

  request(options = {}) {
    let body = null;
    if (options.body) {
      body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      options.headers = options.headers || {};
      options.headers['Trasnfer-Encoding'] = 'chunked';
    }
    let req = new MockRequest({
      method: options.method,
      url: options.url,
      headers: assign({}, this.headers, options.headers)
    });

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
  }

  get(options) {
    this.request(Object.assign(options, { method: 'get' }));
  }
  head(options) {
    this.request(Object.assign(options, { method: 'head' }));
  }
  delete(options) {
    this.request(Object.assign(options, { method: 'delete' }));
  }
  post(options) {
    this.request(Object.assign(options, { method: 'post' }));
  }
  put(options) {
    this.request(Object.assign(options, { method: 'put' }));
  }
  patch(options) {
    this.request(Object.assign(options, { method: 'patch' }));
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

export default function acceptanceTestForApp(tests) {
  test.beforeEach('setup app for acceptance test', (t) => {
    t.context.app = new AcceptanceTestApp();
    return t.context.app.runInitializers();
  });

  tests();
}
