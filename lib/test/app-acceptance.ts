import path from 'path';
import { all } from 'bluebird';
import {
  assign,
  forEach
} from 'lodash';
import { IncomingMessage } from 'http';
import MockRequest from './mock-request';
import MockResponse from './mock-response';
import DenaliObject from '../metal/object';
import Application from '../runtime/application';

export class AppAcceptance extends DenaliObject {

  application: Application;

  constructor() {
    super();
    let compiledPath = process.cwd();
    let ApplicationClass: typeof Application = require(path.join(compiledPath, 'app/application')).default;
    let environment = process.env.DENALI_ENV || process.env.NODE_ENV || 'test';
    this.application = new Application({
      environment,
      dir: compiledPath,
      addons: <string[]>[]
    });
  }

  start(): Promise<void> {
    return this.application.runInitializers();
  }

  _injections: { [fullName: string]: any } = {};

  headers: { [name: string]: string } = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };

  async request(options: { method: string, url: string, body?: any, headers?: { [key: string]: string } }) {
    let body: any = null;
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

      this.application.router.handle(<any>req, <any>res);

      setTimeout(() => {
        if (body) {
          req.write(body);
        }
        req.end();
      }, 10);
    });
  }

  get(url: string, options = {}): Promise<{ status: number, body: any }> {
    return this.request(Object.assign(options, { url, method: 'get' }));
  }
  head(url: string, options = {}): Promise<{ status: number, body: any }> {
    return this.request(Object.assign(options, { url, method: 'head' }));
  }
  delete(url: string, options = {}): Promise<{ status: number, body: any }> {
    return this.request(Object.assign(options, { url, method: 'delete' }));
  }
  post(url: string, body: any, options = {}): Promise<{ status: number, body: any }> {
    return this.request(Object.assign(options, { url, body, method: 'post' }));
  }
  put(url: string, body: any, options = {}): Promise<{ status: number, body: any }> {
    return this.request(Object.assign(options, { url, body, method: 'put' }));
  }
  patch(url: string, body: string, options = {}): Promise<{ status: number, body: any }> {
    return this.request(Object.assign(options, { url, body, method: 'patch' }));
  }

  getHeader(name: string): string {
    return this.headers[name];
  }

  setHeader(name: string, value: string): void {
    this.headers[name] = value;
  }

  removeHeader(name: string): void {
    delete this.headers[name];
  }

  lookup(name: string): any {
    return this.application.container.lookup(name);
  }

  inject(name: string, value: any): void {
    this._injections[name] = this.application.container.lookup(name);
    this.application.container.register(name, value);
  }

  restore(name: string): void {
    this.application.container.register(name, this._injections[name]);
    delete this._injections[name];
  }

  shutdown(): Promise<void> {
    return this.application.shutdown();
  }

}

export default function appAcceptanceTest(ava: any) {

  ava.beforeEach(async (t: any) => {
    let app = t.context.app = new AppAcceptance();
    await app.start();
    let adapters = app.application.container.lookupAll('orm-adapter');
    let transactionInitializers: Promise<void>[] = [];
    forEach(adapters, (Adapter) => {
      if (typeof Adapter.startTestTransaction === 'function') {
        transactionInitializers.push(Adapter.startTestTransaction());
      }
    });
    await all(transactionInitializers);
  });

  ava.afterEach.always(async (t: any) => {
    let app = t.context.app;
    let transactionRollbacks: Promise<void>[] = [];
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
