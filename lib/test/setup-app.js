/* globals before */
import fs from 'fs';
import path from 'path';
import MockReq from 'mock-req';
import MockRes from 'mock-res';
import assign from 'lodash/assign';

export default function setupApp(options = {}) {
  let defaultContentType = options.contentType || 'application/json';

  before(function() {

    // When testing apps, use app/application as the base application instance;
    // but when testing addons, use the dummy app (test/dummy) as the base
    // application
    let applicationRoot;
    let addons = [];
    if (fs.existsSync(path.join(process.cwd(), 'app/addon.js'))) {
      applicationRoot = path.join(process.cwd(), 'test/dummy');
      addons.push(process.cwd());
    } else {
      applicationRoot = process.cwd();
    }

    let Application = require(path.join(applicationRoot, 'app/application')).default;
    let environment = process.env.DENALI_ENV || process.env.NODE_ENV || 'test';
    let application = new Application({
      environment,
      addons,
      dir: applicationRoot
    });

    // Create test app API wrapper
    let wrapper = {
      _injections: {},
      headers: {},
      request(req) {
        return new Promise((resolve, reject) => {
          let res = new MockRes(() => {
            if (res.statusCode < 500) {
              let body = null;
              try {
                body = res._getJSON();
              } catch (e) {} // eslint-disable-line no-empty
              resolve({ status: res.statusCode, body });
            } else {
              let payload = JSON.stringify(res._getJSON(), null, 2);
              payload = payload.replace(/\\n/g, '\n');
              reject(new Error(`Request failed - ${ req.method.toUpperCase() } ${ req.url } returned a ${ res.statusCode }:\n${ payload }`));
            }
          });
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

    // Add request helper methods
    [ 'get', 'head', 'delete' ].forEach((method) => {
      wrapper[method] = function(url, headers) {
        return wrapper.request(buildRequest(method, url, headers));
      };
    });
    [ 'post', 'put', 'patch' ].forEach((method) => {
      wrapper[method] = function(url, body, headers = {}) {
        headers['Content-type'] = headers['Content-type'] || defaultContentType;
        body = typeof body === 'string' ? body : JSON.stringify(body);
        headers['Content-length'] = Buffer.byteLength(body);

        let req = buildRequest(method, url, headers);
        // Ensure async request handling
        setTimeout(() => {
          req.write(body);
          req.end();
        }, 10);
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

    this.app = wrapper; // eslint-disable-line no-invalid-this

    return application.runInitializers();

  });
}
