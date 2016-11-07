import { Transform } from 'stream';
import { toString, mapValues, mapKeys, flatten, toPairs } from 'lodash';

export default class MockRequest extends Transform {

  socket = {
    remoteAddress: '123.45.67.89'
  };

  constructor(options = {}) {
    super();
    this._writableState.objectMode = true;
    this._readableState.objectMode = false;

    this.method = options.method || 'GET';
    this.url = options.url || '';
    this.headers = options.headers || {};

    this.method = this.method.toUpperCase();

    if ([ 'POST', 'PUT', 'PATCH' ].includes(this.method)) {
      this.headers['Transfer-Encoding'] = 'chunked';
    }

    this.headers = mapValues(this.headers, toString);
    this.headers = mapKeys(this.headers, (value, key) => {
      return key.toLowerCase();
    });
    this.rawHeaders = flatten(toPairs(this.headers));

    if (![ 'POST', 'PUT', 'PATCH' ].includes(this.method)) {
      delete this.headers['content-type'];
      delete this.rawHeaders['content-type'];
    }
  }

  _transform(chunk, encoding, next) {
    if (typeof chunk !== 'string' && !Buffer.isBuffer(chunk)) {
      chunk = JSON.stringify(chunk);
    }
    this.push(chunk);
    next();
  }

}
