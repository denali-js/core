import path from 'path';
import findup from 'findup-sync';
import MockReq from 'mock-req';
import MockRes from 'mock-res';
import assign from 'lodash/assign';

export default function setupApp() {
  // TODO this shouldn't have to be aware of dist/
  let Application = require(path.join(process.cwd(), 'app/application')).default;
  let application = new Application({
    environment: process.env.DENALI_ENV || process.env.NODE_ENV || 'test',
    dir: process.cwd()
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
            reject(new Error(`Request failed - ${ req.method.toUpperCase() } ${ req.url } returned a ${ res.statusCode }:\n${ JSON.stringify(res._getJSON(), null, 2) }`));
          }
        });
        global.my_response = res;
        application.router.handle(req, res);
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
      return wrapper.request(buildRequest(method, url, headers));
    };
  });
  [ 'post', 'put', 'patch' ].forEach((method) => {
    wrapper[method] = function(url, body, headers) {
      let req = buildRequest(method, url, headers);
      req.write(JSON.stringify(body));
      req.end();
      return wrapper.request(req);
    };
  });

  function buildRequest(method, url, headers) {
    let req = new MockReq({
      method,
      url,
      headers: assign({}, wrapper.headers, headers)
    });
    req.socket = {
      remoteAddress: '123.45.67.890'
    };
    return req;
  }

  return wrapper;
}
