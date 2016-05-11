import path from 'path';
import findup from 'findup-sync';
import MockReq from 'mock-req';
import MockRes from 'mock-res';
import assign from 'lodash/assign';

export default function setupApp() {
  let projectDir = path.dirname(findup('package.json'));
  let Application = require(path.join(projectDir, 'app/application'));
  let application = new Application({
    environment: process.env.DENALI_ENV || process.env.NODE_ENV || 'test',
    dir: projectDir
  });

  let wrapper = {
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
        application.dispatcher(req, res);
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
    }
  };

  [ 'get', 'head', 'delete' ].forEach((method) => {
    wrapper[method] = function(url, headers) {
      let req = new MockReq({
        method,
        url,
        headers: assign({}, wrapper.headers, headers)
      });
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
      req.write(JSON.stringify(body));
      req.end();
      return wrapper.request(req);
    };
  });

  return wrapper;
}
