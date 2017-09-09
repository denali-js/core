import { Dict } from '../utils/types';
// import inject from '../metal/inject';
import Route from './route';
import ConfigService from './config';
import Container from '../metal/container';
import { constant } from 'lodash';
import { Request as ExpressRequest } from 'express';
import * as accepts from 'accepts';
import { Socket, isIP } from 'net';
import { Readable as ReadableStream } from 'stream';
import { TLSSocket } from 'tls';
import * as typeis from 'type-is';
import * as http from 'http';
import * as https from 'https';
import * as parseRange from 'range-parser';
import * as parse from 'parseurl';
import * as proxyaddr from 'proxy-addr';
import * as uuid from 'uuid';

/**
 * The Request class represents an incoming HTTP request (specifically, Node's IncomingMessage).
 * It's designed with an express-compatible interface to allow interop with existing express
 * middleware.
 *
 * @package runtime
 * @since 0.1.0
 */
/* tslint:disable:member-ordering */
export default class Request extends ReadableStream implements ExpressRequest, http.IncomingMessage, https.IncomingMessage {

  constructor(container: Container, incomingMessage: http.IncomingMessage | https.IncomingMessage) {
    super();
    this.container = container;
    this._incomingMessage = incomingMessage;
  }

  //
  // Denali extensions
  //

  _incomingMessage: http.IncomingMessage | https.IncomingMessage;

  container: Container;

  // TODO this should ideally use the inject helper
  get config(): ConfigService {
    return this.container.lookup('config:service');
  }

  /**
   * A UUID generated unqiue to this request. Useful for tracing a request through the application.
   *
   * @since 0.1.0
   */
  id: string = uuid.v4();

  /**
   * The route parser route that was matched
   *
   * @since 0.1.0
   */
  route: Route;

  /**
   * The name of the original action that was invoked - useful for error actions to create
   * helpful debug messages.
   *
   * @since 0.1.0
   */
  _originalAction: string;



  //
  // http.IncomingMessage interface
  //

  get method(): string { return this._incomingMessage.method; }

  get httpVersion(): string { return this._incomingMessage.httpVersion; }
  get httpVersionMajor(): number { return this._incomingMessage.httpVersionMajor; }
  get httpVersionMinor(): number { return this._incomingMessage.httpVersionMinor; }

  get connection(): Socket | TLSSocket { return this._incomingMessage.connection; }
  get socket(): Socket | TLSSocket { return this._incomingMessage.connection; }

  get headers(): Dict<string> { return <Dict<string>>this._incomingMessage.headers; }
  get rawHeaders(): string[] { return this._incomingMessage.rawHeaders; }
  get trailers(): Dict<string> { return this._incomingMessage.trailers; }
  get rawTrailers(): string[] { return this._incomingMessage.rawTrailers; }

  setTimeout(timeout: number, callback: () => void): this {
    this._incomingMessage.setTimeout(timeout, callback);
    return this;
  }
  destroy(error?: Error): void {
    this._incomingMessage.destroy(error);
  }

  //
  // Express Request interface
  //

  // This doesn't appear in the actual express source code or docs, perhaps a typing bug ...
  accepted: any[];

  body: any;

  params: any;

  query: any;

  cookies: Dict<string> = {};

  signedCookies: Dict<string> = {};

  get url(): string {
    return this._incomingMessage.url;
  }

  get originalUrl(): string {
    return this.url;
  }

  baseUrl = '/';

  get app(): any {
    throw new Error('`req.app` is not supported. That is an Express API that would return the Express app, which does not exist in Denal');
  }

  /**
   * Return request header.
   *
   * The `Referrer` header field is special-cased,
   * both `Referrer` and `Referer` are interchangeable.
   *
   * Examples:
   *
   *     req.get('Content-Type');
   *     // => "text/plain"
   *
   *     req.get('content-type');
   *     // => "text/plain"
   *
   *     req.get('Something');
   *     // => undefined
   *
   * Aliased as `req.header()`.
   */
  get(name: string): string | undefined {
    return this.header(name);
  }

  header(name: string): string | undefined {
    if (!name) {
      throw new TypeError('name argument is required to req.get');
    }

    if (typeof name !== 'string') {
      throw new TypeError('name must be a string to req.get');
    }

    let lc = name.toLowerCase();
    let headers = <Dict<string>>this.headers;

    switch (lc) {
      case 'referer':
      case 'referrer':
        return headers.referrer
          || headers.referer;
      default:
        return headers[lc];
    }
  }

  /**
   * Check if the given `type(s)` is acceptable, returning
   * the best match when true, otherwise `undefined`, in which
   * case you should respond with 406 "Not Acceptable".
   *
   * The `type` value may be a single MIME type string
   * such as "application/json", an extension name
   * such as "json", a comma-delimited list such as "json, html, text/plain",
   * an argument list such as `"json", "html", "text/plain"`,
   * or an array `["json", "html", "text/plain"]`. When a list
   * or array is given, the _best_ match, if any is returned.
   *
   * Examples:
   *
   *     // Accept: text/html
   *     req.accepts('html');
   *     // => "html"
   *
   *     // Accept: text/*, application/json
   *     req.accepts('html');
   *     // => "html"
   *     req.accepts('text/html');
   *     // => "text/html"
   *     req.accepts('json, text');
   *     // => "json"
   *     req.accepts('application/json');
   *     // => "application/json"
   *
   *     // Accept: text/*, application/json
   *     req.accepts('image/png');
   *     req.accepts('png');
   *     // => undefined
   *
   *     // Accept: text/*;q=.5, application/json
   *     req.accepts(['html', 'json']);
   *     req.accepts('html', 'json');
   *     req.accepts('html, json');
   *     // => "json"
   */
  accepts(): string[];
  accepts(type: string | string[]): string | false;
  accepts(...type: string[]): string | false;
  accepts(...type: string[]): string[] | string | false {
    let accept = accepts(this);
    return accept.types(...type);
  }

  /**
   * Check if the given `encoding`s are accepted.
   */
  acceptsEncodings(): string[];
  acceptsEncodings(encoding: string | string[]): string | false;
  acceptsEncodings(...encoding: string[]): string | false;
  acceptsEncodings(...encoding: string[]): string[] | string | false {
    let accept = accepts(this);
    return accept.encodings(...encoding);
  }

  /**
   * Check if the given `charset`s are acceptable,
   * otherwise you should respond with 406 "Not Acceptable".
   */
  acceptsCharsets(): string[];
  acceptsCharsets(charset: string | string[]): string | false;
  acceptsCharsets(...charset: string[]): string | false;
  acceptsCharsets(...charset: string[]): string[] | string | false {
    let accept = accepts(this);
    return accept.charsets(...charset);
  }

  /**
   * Check if the given `lang`s are acceptable,
   * otherwise you should respond with 406 "Not Acceptable".
   */
  acceptsLanguages(): string[];
  acceptsLanguages(lang: string | string[]): string | false;
  acceptsLanguages(...lang: string[]): string | false;
  acceptsLanguages(...lang: string[]): string[] | string | false {
    let accept = accepts(this);
    return accept.languages(...lang);
  }

  /**
   * Parse Range header field, capping to the given `size`.
   *
   * Unspecified ranges such as "0-" require knowledge of your resource length. In
   * the case of a byte range this is of course the total number of bytes. If the
   * Range header field is not given `undefined` is returned, `-1` when unsatisfiable,
   * and `-2` when syntactically invalid.
   *
   * When ranges are returned, the array has a "type" property which is the type of
   * range that is required (most commonly, "bytes"). Each array element is an object
   * with a "start" and "end" property for the portion of the range.
   *
   * The "combine" option can be set to `true` and overlapping & adjacent ranges
   * will be combined into a single range.
   *
   * NOTE: remember that ranges are inclusive, so for example "Range: users=0-3"
   * should respond with 4 users when available, not 3.
   */
  range(size: number, options?: parseRange.Options): any[] {
    let range = this.get('Range');
    if (!range) {
      return;
    }
    // this <any> seems to be necessary because the express types for `range()`
    // are incorrect, or at least incompatible with the types for `parseRange()`
    return <any>parseRange(size, range, options);
  }

  /**
   * Return the value of param `name` when present or `defaultValue`.
   *
   *  - Checks route placeholders, ex: _/user/:id_
   *  - Checks body params, ex: id=12, {"id":12}
   *  - Checks query string params, ex: ?id=12
   *
   * To utilize request bodies, `req.body`
   * should be an object. This can be done by using
   * the `bodyParser()` middleware.
   */
  param(name: string, defaultValue: any): any {
    let params = this.params || {};
    let body = this.body || {};
    let query = this.query || {};

    if (params[name] != null && params.hasOwnProperty(name)) {
      return params[name];
    }
    if (body[name] != null) {
      return body[name];
    }
    if (query[name] != null) {
      return query[name];
    }

    return defaultValue;
  }

  /**
   * Check if the incoming request contains the "Content-Type"
   * header field, and it contains the give mime `type`.
   *
   * Examples:
   *
   *      // With Content-Type: text/html; charset=utf-8
   *      req.is('html');
   *      req.is('text/html');
   *      req.is('text/*');
   *      // => true
   *
   *      // When Content-Type is application/json
   *      req.is('json');
   *      req.is('application/json');
   *      req.is('application/*');
   *      // => true
   *
   *      req.is('html');
   *      // => false
   */
  is(...types: string[]): boolean {
    if (Array.isArray(types[0])) {
      types = <any>types[0];
    }
    return typeis(this, types);
  }

  /**
   * Return the protocol string "http" or "https"
   * when requested with TLS. When the "server.trustProxy"
   * setting trusts the socket address, the
   * "X-Forwarded-Proto" header field will be trusted
   * and used if present.
   *
   * If you're running behind a reverse proxy that
   * supplies https for you this may be enabled.
   */
  get protocol(): 'http' | 'https' {
    let rawProtocol: 'http' | 'https' = (<TLSSocket>this.connection).encrypted ? 'https' : 'http';
    let trustProxyConfig = this.config.getWithDefault('server', 'trustProxy', constant(false));
    let ip = this.connection.remoteAddress;

    if (trustProxyConfig) {
      if (typeof trustProxyConfig !== 'function') {
        trustProxyConfig = proxyaddr.compile(trustProxyConfig);
      }
      if (trustProxyConfig(ip, 0)) {
        let proxyClaimedProtocol = this.get('X-Forwarded-Proto') || rawProtocol;
        return <'http' | 'https'>proxyClaimedProtocol.split(/\s*,\s*/)[0];
      }
    }
    return rawProtocol;
  }

  /**
   * Short-hand for:
   *
   *    req.protocol === 'https'
   */
  get secure(): boolean {
    return this.protocol === 'https';
  }

  /**
   * Return the remote address from the trusted proxy.
   *
   * The is the remote address on the socket unless
   * "trust proxy" is set.
   */

  get ip(): string {
    let trustProxyConfig = this.config.getWithDefault('server', 'trustProxy', constant(false));
    return proxyaddr(this._incomingMessage, trustProxyConfig);
  }

  /**
   * When "trust proxy" is set, trusted proxy addresses + client.
   *
   * For example if the value were "client, proxy1, proxy2"
   * you would receive the array `["client", "proxy1", "proxy2"]`
   * where "proxy2" is the furthest down-stream and "proxy1" and
   * "proxy2" were trusted.
   */
  get ips(): string[] {
    let trustProxyConfig = this.config.getWithDefault('server', 'trustProxy', constant(false));
    let ips = proxyaddr.all(this._incomingMessage, trustProxyConfig);
    ips.reverse().pop();
    return ips;
  }

  /**
   * Return subdomains as an array.
   *
   * Subdomains are the dot-separated parts of the host before the main domain of
   * the app. By default, the domain of the app is assumed to be the last two
   * parts of the host. This can be changed by setting "subdomain offset".
   *
   * For example, if the domain is "tobi.ferrets.example.com":
   * If "subdomain offset" is not set, req.subdomains is `["ferrets", "tobi"]`.
   * If "subdomain offset" is 3, req.subdomains is `["tobi"]`.
   */
  get subdomains(): string[] {
    let hostname = this.hostname;

    if (!hostname) {
      return [];
    }

    let offset = this.config.getWithDefault('server', 'subdomainOffset', 2);
    let subdomains = !isIP(hostname) ? hostname.split('.').reverse() : [ hostname ];
    return subdomains.slice(offset);
  }

  /**
   * Short-hand for `url.parse(req.url).pathname`.
   */
  get path(): string {
    return parse(this._incomingMessage).pathname;
  }

  /**
   * Parse the "Host" header field to a hostname.
   *
   * When the "trust proxy" setting trusts the socket
   * address, the "X-Forwarded-Host" header field will
   * be trusted.
   */
  get hostname(): string {
    let host = this.get('X-Forwarded-Host');
    let ip = this.connection.remoteAddress;
    let trustProxyConfig = this.config.getWithDefault('server', 'trustProxy', constant(false));

    if (typeof trustProxyConfig !== 'function') {
      trustProxyConfig = proxyaddr.compile(trustProxyConfig);
    }
    if (!host || !trustProxyConfig(ip, 0)) {
      host = this.get('Host');
    }

    if (!host) {
      return;
    }

    // IPv6 literal support
    let offset = host[0] === '[' ? host.indexOf(']') + 1 : 0;
    let index = host.indexOf(':', offset);

    return index !== -1 ? host.substring(0, index) : host;
  }

  get host(): string {
    return this.hostname;
  }

  /**
   * Check if the request is fresh, aka
   * Last-Modified and/or the ETag
   * still match.
   */
  get fresh(): never {
    // The default express implementation requires the response to be available, and based
    // on a cursory inspection of the docs, it seems necessary.
    throw new Error('`request.fresh is not yet implemented');
  }

  /**
   * Check if the request is stale, aka
   * "Last-Modified" and / or the "ETag" for the
   * resource has changed.
   */

  get stale(): never {
    // The default express implementation requires the response to be available, and based
    // on a cursory inspection of the docs, it seems necessary.
    throw new Error('`request.stale is not yet implemented');
  }

  /**
   * Check if the request was an _XMLHttpRequest_.
   */
  get xhr(): boolean{
    let val = this.get('X-Requested-With') || '';
    return val.toLowerCase() === 'xmlhttprequest';
  }

  clearCookie(name: string, options?: any): never {
    throw new Error('clearCookie is not implemented on the Request object');
  }

}
