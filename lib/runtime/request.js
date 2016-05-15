import accepts from 'accepts';
import typeis from 'type-is';
import dropRight from 'lodash/dropRight';
import url from 'url';

export default class Request {

  constructor(request) {
    this._request = request;
    this.parsedUrl = url.parse(this._request.url, true);
  }

  get method() {
    return this._request.method.toLowerCase();
  }

  get headers() {
    return this._request.headers;
  }

  get hostname() {
    let host = this._request.headers.Host;
    return (host || '').split(':')[0];
  }

  get ip() {
    return this._request.socket.remoteAddress;
  }

  get path() {
    return this.parsedUrl.pathname;
  }

  get query() {
    return this.parsedUrl.query;
  }

  get subdomains() {
    return dropRight(this.hostname.split('.'));
  }

  accepts() {
    return accepts(this._request).types(...arguments);
  }

  get(header) {
    return this._request.headers[header];
  }

  is(...types) {
    return typeis(this._request, types);
  }

}
