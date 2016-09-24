import { Transform } from 'stream';
import { STATUS_CODES } from 'http';
import { forEach } from 'lodash';

export default class MockResponse extends Transform {

  statusCode = 200;
  statusMessage = STATUS_CODES[200];
  _headers = {};
  _buffers = [];

  constructor(finish) {
    super();
    if (typeof finish === 'function') {
      this.on('finish', finish);
    }
  }

  _transform(chunk, encoding, next) {
    this.push(chunk);
    this._buffers.push(chunk);
    next();
  }

  setHeader(name, value) {
    this._headers[name.toLowerCase()] = value;
  }

  getHeader(name) {
    return this._headers[name.toLowerCase()];
  }

  removeHeader(name) {
    delete this._headers[name.toLowerCase()];
  }

  _implicitHeader() {
    this.writeHead(this.statusCode);
  }

  writeHead(statusCode, reason, headers) {
    if (arguments.length === 2 && typeof arguments[1] !== 'string') {
      headers = reason;
      reason = null;
    }
    this.statusCode = statusCode;
    this.statusMessage = reason || STATUS_CODES[statusCode] || 'unknown';
    if (headers) {
      forEach(headers, (value, name) => {
        this.setHeader(name, value);
      });
    }
  }

  _getString() {
    return Buffer.concat(this._buffers).toString();
  }

  _getJSON() {
    return JSON.parse(this._getString());
  }

  writeContinue() {
    throw new Error('MockResponse.writeContinue() is not implemented');
  }

  setTimeout() {
    throw new Error('MockResponse.setTimeout() is not implemented');
  }

  addTrailers() {
    throw new Error('MockResponse.addTrailers() is not implemented');
  }

  get headersSent() {
    throw new Error('MockResponse.headersSent is not implemented');
  }

  get sendDate() {
    throw new Error('MockResponse.sendDate is not implemented');
  }

}
