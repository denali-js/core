import accepts from 'accepts';
import typeis from 'type-is';
import dropRight from 'lodash/dropRight';
import url from 'url';

/**
 * The Request class represents an incoming HTTP request (specifically, Node's
 * IncomingMessage). It's designed with an express-compatible interface to allow
 * interop with existing express middleware.
 *
 * @class Request
 * @constructor
 */
export default class Request {

  constructor(request) {
    this._request = request;
    this.parsedUrl = url.parse(this._request.url, true);
  }

  /**
   * The incoming request's URL.
   *
   * See https://nodejs.org/api/http.html#http_message_url
   *
   * @property url
   * @type {String}
   */
  get url() {
    return this._request.url;
  }

  /**
   * The incoming request's method.
   *
   * See https://nodejs.org/api/http.html#http_message_method
   *
   * @property method
   * @type {String}
   */
  get method() {
    return this._request.method.toLowerCase();
  }

  /**
   * The incoming request's headers, represented as an object where the keys are
   * header names and values are the corresponding header values.
   *
   * See https://nodejs.org/api/http.html#http_message_headers
   *
   * @property headers
   * @type {Object}
   */
  get headers() {
    return this._request.headers;
  }

  /**
   * The incoming request's hostname, taken from the request's Host header.
   *
   * @property hostname
   * @type {String}
   */
  get hostname() {
    let host = this._request.headers.Host;
    return (host || '').split(':')[0];
  }

  /**
   * The IP address of the incoming request.
   *
   * @property ip
   * @type {String}
   */
  get ip() {
    return this._request.socket.remoteAddress;
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
    return dropRight(this.hostname.split('.'));
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
    return accepts(this._request).types(...arguments);
  }

  /**
   * Return the value of the given header (case-insensitive).
   *
   * @method get
   * @param header {String}
   * @return {String} the value of the given header
   */
  get(header) {
    return this._request.headers[header.toLowerCase()];
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
    return typeis(this._request, types);
  }

}
