import path from 'path';
import { all } from 'bluebird';
import assign from 'lodash/assign';
import forEach from 'lodash/forEach';
import MockRequest from './mock-request';
import MockResponse from './mock-response';
import DenaliObject from '../metal/object';

export class AppAcceptance extends DenaliObject {

  constructor() {
    super();
    let compiledPath = process.cwd();
    let Application = require(path.join(compiledPath, 'app/application')).default;
    let environment = process.env.DENALI_ENV || process.env.NODE_ENV || 'test';
    this.application = new Application({
      environment,
      addons: [],
      dir: compiledPath
    });
  }

  start() {
    return this.application.runInitializers();
  }

  _injections = {};

  headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };

  async request(options = {}) {
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

  shutdown() {
    this.application.shutdown();
  }

}

export default function appAcceptanceTest(ava) {

  ava.beforeEach(async (t) => {
    let app = t.context.app = new AppAcceptance();
    await app.start();
    let adapters = app.application.container.lookupAll('orm-adapter');
    let transactionInitializers = [];
    forEach(adapters, (Adapter) => {
      if (typeof Adapter.startTestTransaction === 'function') {
        transactionInitializers.push(Adapter.startTestTransaction());
      }
    });
    await all(transactionInitializers);
  });

  ava.afterEach.always(async (t) => {
    let app = t.context.app;
    let transactionRollbacks = [];
    let adapters = app.application.container.lookupAll('orm-adapter');
    forEach(adapters, (Adapter) => {
      if (typeof Adapter.rollbackTestTransaction === 'function') {
        transactionRollbacks.push(Adapter.rollbackTestTransaction());
      }
    });
    await all(transactionRollbacks);
    await app.shutdown();
  });

}
