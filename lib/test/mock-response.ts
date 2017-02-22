import { Transform } from 'stream';
import { STATUS_CODES } from 'http';
import { forEach } from 'lodash';

/**
 * A mock response used to simluate the server response to mock requests during tests. You shouldn't
 * need to instantiate these directly - instead, use an AppAcceptance test.
 *
 * @package test
 */
export default class MockResponse extends Transform {

  // Mock internals of ServerResponse
  // tslint:disable:completed-docs member-access
  statusCode = 200;
  statusMessage = STATUS_CODES[200];
  _headers: { [key: string]: string } = {};
  _buffers: Buffer[] = [];

  constructor(finish?: () => void) {
    super();
    if (typeof finish === 'function') {
      this.on('finish', finish);
    }
  }

  _transform(chunk: Buffer, encoding: string, next: () => void): void {
    this.push(chunk);
    this._buffers.push(chunk);
    next();
  }

  setHeader(name: string, value: string): void {
    this._headers[name.toLowerCase()] = value;
  }

  getHeader(name: string): string {
    return this._headers[name.toLowerCase()];
  }

  removeHeader(name: string): void {
    delete this._headers[name.toLowerCase()];
  }

  _implicitHeader(): void {
    this.writeHead(this.statusCode);
  }

  writeHead(statusCode: number, reason?: string, headers?: { [key: string]: string }): void {
    if (typeof reason !== 'string') {
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
