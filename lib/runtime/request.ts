import accepts from 'accepts';
import typeis from 'type-is';
import {
  dropRight,
  uniq,
  isArray
} from 'lodash';
import url from 'url';
import http from 'http';
import uuid from 'node-uuid';
import DenaliObject from '../metal/object';
import Route from './route';

export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options';

/**
 * The Request class represents an incoming HTTP request (specifically, Node's
 * IncomingMessage). It's designed with an express-compatible interface to allow
 * interop with existing express middleware.
 *
 * @export
 * @class Request
 * @extends {DenaliObject}
 * @module denali
 * @submodule runtime
 */
export default class Request extends DenaliObject {

  /**
   * A UUID generated unqiue to this request. Useful for tracing a request through the application.
   *
   * @type {string}
   */
  public id: string;

  /**
   * The parsed URL of the IncomingMessage
   *
   * @private
   * @type {url.Url}
   */
  private parsedUrl: url.Url;

  /**
   * The original IncomingMessage from the HTTP library.
   *
   * @private
   * @type {http.IncomingMessage}
   */
  private _incomingMessage: http.IncomingMessage;

  public route: Route;
  public params: any;
  public body: any;
  public _originalAction: string;

  /**
   * Creates an instance of Request based on the supplied IncomingMessage
   *
   * @param {http.IncomingMessage} incomingMessage
   */
  constructor(incomingMessage: http.IncomingMessage) {
    super();
    this._incomingMessage = incomingMessage;
    this.parsedUrl = url.parse(incomingMessage.url, true);
    this.id = uuid.v4();
  }

  /**
   * The HTTP method of the request, lowercased
   *
   * @readonly
   * @type {Method}
   */
  get method(): Method {
    return <Method>this._incomingMessage.method.toLowerCase();
  }

  /**
   * The host name specified in the request (not including port number)
   *
   * @readonly
   * @type {string}
   */
  get hostname(): string {
    let host = this._incomingMessage.headers.Host;
    return (host || '').split(':')[0];
  }

  /**
   * The IP address of the incoming request's connection
   *
   * @readonly
   * @type {string}
   */
  get ip(): string {
    return this._incomingMessage.socket.remoteAddress;
  }

  /**
   * The path extracted from the URL of the incoming request.
   *
   * @readonly
   * @type {string}
   */
  get path(): string {
    return this.parsedUrl.pathname;
  }

  /**
   * The query params supplied with the request URL, parsed into an object
   *
   * @readonly
   * @type {{ [key: string]: string }}
   */
  get query(): { [key: string]: string } {
    return this.parsedUrl.query;
  }

  get headers(): { [key: string]: string } {
    return this._incomingMessage.headers;
  }

  /**
   * An array of subdomains of the incoming request.
   *
   * @readonly
   * @type {string[]}
   * @example
   *   // GET foo.bar.example.com
   *   request.subdomains  // [ 'foo', 'bar' ]
   */
  get subdomains(): string[] {
    // drop the domain and tld
    return dropRight(this.hostname.split('.'), 2);
  }

  /**
   * Returns the best match for content types, or false if no match is possible. See the docs for
   * the `accepts` module on npm for more details.
   *
   * @param {...string[]} args
   * @returns {(string | boolean)}
   */
  accepts(serverAcceptedTypes: string[]): string | boolean {
    return accepts(this._incomingMessage).type(serverAcceptedTypes);
  }

  /**
   * Gets the value of a header.
   *
   * @param {string} header
   * @returns {string}
   */
  get(header: string): string {
    return this._incomingMessage.headers[header.toLowerCase()];
  }

  /**
   * Checks if the request matches the supplied content types. See type-is module for details.
   *
   * @param {...string[]} types
   * @returns {(string | boolean)}
   */
  is(...types: string[]): string | boolean {
    return <string|boolean>typeis(this._incomingMessage, types);
  }

}
