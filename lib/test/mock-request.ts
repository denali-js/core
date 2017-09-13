
import { IncomingMessage as IncomingHttpMessage, IncomingHttpHeaders } from 'http';
import { IncomingMessage as IncomingHttpsMessage } from 'https';
import { PassThrough, Readable } from 'stream';
import * as url from 'url';
import { Socket } from 'net';
import { Dict } from '../utils/types';
import { toPairs, flatten } from 'lodash';


export interface MockMessageOptions {
  method?: string;
  url?: string;
  headers?: IncomingHttpHeaders;
  trailers?: Dict<string>;
  httpVersion?: string;
  json?: any;
  body?: Readable | Buffer | string;
}

/**
 * A mock request used to simluate an HTTP request to the application during tests. You shouldn't
 * need to instantiate these directly - instead, use an AppAcceptance test.
 *
 * @package test
 */
export default class MockRequest extends PassThrough implements IncomingHttpMessage, IncomingHttpsMessage {

  httpVersion = '1.1';
  get httpVersionMajor() {
    return Number(this.httpVersion.split('.')[0]);
  }
  get httpVersionMinor() {
    return Number(this.httpVersion.split('.')[1]);
  }

  connection: Socket;
  get socket(): Socket {
    return this.connection;
  }

  headers: IncomingHttpHeaders;
  get rawHeaders(): string[] {
    return flatten(toPairs(this.headers));
  }

  method = 'GET';
  url = '/';

  trailers: Dict<string>;
  rawTrailers: string[];

  readable = true;

  _mockBodyStream = new PassThrough();

  constructor(options: MockMessageOptions = {}) {
    super();

    this.method = options.method || this.method;

    let parsedUrl = url.parse(options.url || this.url);
    this.url = parsedUrl.path;

    this.headers = options.headers || {};
    this.trailers = options.trailers || {};

    this.httpVersion = options.httpVersion || this.httpVersion;
    this.connection = new Socket();
    Object.defineProperty(this.connection, 'remoteAddress', {
      value: '192.168.1.1'
    });
    Object.defineProperty(this.connection, 'encrypted', {
      get: () => {
        return parsedUrl.protocol === 'https:';
      }
    });

    let json = options.json;
    if (json) {
      options.body = JSON.stringify(options.json);
    }

    let body = options.body;
    process.nextTick(() => {
      if (body) {
        if (isReadableStream(body)) {
          body.pipe(this._mockBodyStream);
        } else {
          if (!this.headers['content-length']) {
            this.headers['content-length'] = String(body.length);
          }
          this._mockBodyStream.write(body);
        }
      }
    });
  }

  _read(size: number) {
    return this._mockBodyStream.read(size);
  }

  setTimeout(msecs: number, callback: () => void): this {
    return this;
  }
  destroy() {
    // noop
  }

  // // Mock internals of IncomingMessage
  // // tslint:disable:completed-docs member-access
  // method: string;
  // url: string;
  // headers: {
  //   [key: string]: string
  // };
  // rawHeaders: string[];

  // _writableState: any;
  // _readableState: any;

  // socket = {
  //   remoteAddress: '123.45.67.89'
  // };

  // constructor(options: { method?: string, url?: string, headers?: { [key: string]: string } } = {}) {
  //   super();
  //   this._writableState.objectMode = true;
  //   this._readableState.objectMode = false;

  //   this.method = options.method || 'GET';
  //   this.url = options.url || '';
  //   this.headers = options.headers || {};

  //   this.method = this.method.toUpperCase();

  //   if ([ 'POST', 'PUT', 'PATCH' ].indexOf(this.method) > -1) {
  //     this.headers['Transfer-Encoding'] = 'chunked';
  //   }

  //   this.headers = mapValues(this.headers, toString);
  //   this.headers = mapKeys(this.headers, (value, key) => {
  //     return key.toLowerCase();
  //   });
  //   this.rawHeaders = flatten(toPairs(this.headers));

  //   if ([ 'POST', 'PUT', 'PATCH' ].indexOf(this.method) === -1) {
  //     delete this.headers['content-type'];
  //     this.rawHeaders = without(this.rawHeaders, 'content-type');
  //   }
  // }

  // _transform(chunk: string | Buffer | {}, encoding: string, next: () => void) {
  //   if (typeof chunk !== 'string' && !Buffer.isBuffer(chunk)) {
  //     chunk = JSON.stringify(chunk);
  //   }
  //   this.push(chunk);
  //   next();
  // }
  // // tslint:enable:completed-docs

}

function isReadableStream(stream: any): stream is Readable {
  return typeof stream.pipe === 'function';
}
