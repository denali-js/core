import path from 'path';
import findup from 'findup-sync';
import MockReq from 'mock-req';
import MockRes from 'mock-res';
import ExpressResponse from 'express/lib/response';
import assign from 'lodash/assign';

Object.setPrototypeOf(MockRes.prototype, ExpressResponse);

export default function setupApp() {
  // TODO this shouldn't have to be aware of dist/
  let projectDir = path.resolve(path.join(path.dirname(findup('package.json')), 'dist'));
  process.chdir(projectDir);
  let Application = require(path.join(projectDir, 'app/application')).default;
  let application = new Application({
    environment: process.env.DENALI_ENV || process.env.NODE_ENV || 'test',
    dir: projectDir
  });

  let wrapper = {
    _injections: {},
    headers: {},
    request(req) {
      return new Promise((resolve, reject) => {
        let res = new MockRes(() => {
          if (res.statusCode < 500) {
            resolve({ status: res.statusCode, body: res._getJSON() });
          } else {
            reject({ status: res.statusCode, body: res._getJSON() });
          }
        });
        application.dispatcher(req, res, (err) => {
          reject(err);
        });
      });
    },
    getHeader(name) {
      return wrapper.headers[name];
    },
    setHeader(name, value) {
      wrapper.headers[name] = value;
    },
    removeHeader(name) {
      delete wrapper.headers[name];
    },
    lookup() {
      return application.container.lookup(...arguments);
    },
    inject(name, value) {
      this._injections[name] = application.container.lookup(name);
      application.container.register(name, value);
    },
    restore(name) {
      application.container.register(name, this._injections[name]);
      delete this._injections[name];
    }
  };

  [ 'get', 'head', 'delete' ].forEach((method) => {
    wrapper[method] = function(url, headers) {
      let req = new MockReq({
        method,
        url,
        headers: assign({}, wrapper.headers, headers)
      });
      req.socket = {
        destroy() {}
      };
      return wrapper.request(req);
    };
  });
  [ 'post', 'put', 'patch' ].forEach((method) => {
    wrapper[method] = function(url, body, headers) {
      let req = new MockReq({
        method,
        url,
        headers: assign({}, wrapper.headers, headers)
      });
      req.socket = {
        destroy() {}
      };
      req.write(JSON.stringify(body));
      req.end();
      return wrapper.request(req);
    };
  });

  return wrapper;
}
