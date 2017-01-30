import accepts from 'accepts';
import typeis from 'type-is';
import dropRight from 'lodash/dropRight';
import uniq from 'lodash/uniq';
import url from 'url';
import uuid from 'node-uuid';
import DenaliObject from '../metal/object';

/**
 * The Request class represents an incoming HTTP request (specifically, Node's
 * IncomingMessage). It's designed with an express-compatible interface to allow
 * interop with existing express middleware.
 *
 * @class Request
 * @constructor
 * @extends http.IncomingMessage
 * @param incomingMessage {http.incomingMessage}
 * @module denali
 * @submodule runtime
 */
export default class Request extends DenaliObject {

  /**
   * The raw IncomingMessage instance from Node's http server
   *
   * @property _incomingMessage
   * @type {http.IncomingMessage}
   * @private
   */
  _incomingMessage;

  constructor(incomingMessage) {
    this._incomingMessage = incomingMessage;
    this.parsedUrl = url.parse(incomingMessage.url, true);
    this.id = uuid();

    return new Proxy(incomingMessage, {
      getPrototypeOf: () => {
        return Object.getPrototypeOf(this);
      },
      getOwnPropertyDescriptor: (target, prop) => {
        return Object.getOwnPropertyDescriptor(this, prop) ||
               Object.getOwnPropertyDescriptor(incomingMessage, prop);
      },
      has: (target, prop) => {
        return (prop in this) || (prop in incomingMessage);
      },
      get: (target, prop) => {
        return prop in this ? this[prop] : incomingMessage[prop];
      },
      set: (target, prop, value) => {
        this[prop] = value;
        return true;
      },
      deleteProperty: (target, prop) => {
        delete this[prop];
        return true;
      },
      ownKeys: () => {
        let keys = Object.getOwnPropertyNames(this)
          .concat(Object.getOwnPropertyNames(incomingMessage));
        return uniq(keys);
      }
    });
  }

  /**
   * The incoming request's method (lowercased).
   *
   * See https://nodejs.org/api/http.html#http_message_method
   *
   * @property method
   * @type {String}
   */
  get method() {
    return this._incomingMessage.method.toLowerCase();
  }

  /**
   * The incoming request's hostname, taken from the request's Host header.
   *
   * @property hostname
   * @type {String}
   */
  get hostname() {
    let host = this._incomingMessage.headers.Host;
    return (host || '').split(':')[0];
  }

  /**
   * The IP address of the incoming request.
   *
   * @property ip
   * @type {String}
   */
  get ip() {
    return this._incomingMessage.socket.remoteAddress;
  }

  /**
   * The incoming request's path.
   *
   * @property path
   * @type {String}
   */
  get path() {
    return this.parsedUrl.pathname;
  }

  /**
   * The incoming request's query parameters (parsed into JS objects).
   *
   * @property query
   * @type {String}
   */
  get query() {
    return this.parsedUrl.query;
  }

  /**
   * The incoming request's subdomains as an array.
   *
   * @property path
   * @type {String[]}
   */
  get subdomains() {
    // drop the domain and tld
    return dropRight(this.hostname.split('.'), 2);
  }

  /**
   * Check if a mime-type (or shorthand type, i.e. 'json') matches the incoming
   * request's Accept header. You can supply multiple types (as separate args,
   * or in an array) in order of preference, and the best match will be
   * returned.
   *
   * See [accepts](https://www.npmjs.com/package/accepts).
   *
   * @method path
   * @param ...types {String|String[]}
   * @return {String|Boolean} The best match, or false if no match found
   */
  accepts() {
    return accepts(this._incomingMessage).types(...arguments);
  }

  /**
   * Return the value of the given header (case-insensitive).
   *
   * @method get
   * @param header {String}
   * @return {String} the value of the given header
   */
  get(header) {
    return this._incomingMessage.headers[header.toLowerCase()];
  }

  /**
   * Returns the matching type of the incoming request.
   *
   * See [type-is](https://www.npmjs.com/package/type-is).
   *
   * @method is
   * @param ...types {String}
   * @return {String} the matching type
   */
  is(...types) {
    return typeis(this._incomingMessage, types);
  }

}
