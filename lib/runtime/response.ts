import assert from 'assert';
import {
  isNumber
} from 'lodash';
import DenaliObject from '../metal/object';

/**
 * The Response class represents a response to an incoming request. You can
 * return an instance of this class from your action's responder method to
 * render a response with a custom status code, headers, or body.
 *
 * @export
 * @class Response
 * @extends {DenaliObject}
 * @module denali
 * @submodule runtime
 */
export default class Response extends DenaliObject {

  public status: number;
  public body: any;
  public options: any;

  /**
   * Create a Response instance. Accepts a status code, a body payload, and an
   * options hash.
   *
   * @param {number} status
   * @param {*} body
   * @param {*} [options={}]
   */
  constructor(status: number, body: any, options: any = {}) {
    super();
    assert(isNumber(status), 'You must at least supply a status code when creating a response');
    this.status = status;
    this.body = body;
    this.options = options;
  }

  /**
   * The content type of the response. Set via the `options` argument of the
   * Response constructor.
   */
  /**
   * The Content-Type to use with the response.
   *
   * @type {string}
   */
  get contentType(): string {
    return this.options.contentType || 'application/json';
  }
  set contentType(value: string) {
    this.options.contentType = value;
  }

}
