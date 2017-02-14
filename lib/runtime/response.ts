import * as assert from 'assert';
import {
  isNumber
} from 'lodash';
import DenaliObject from '../metal/object';
import * as http from 'http';

/**
 * The Response class represents a response to an incoming request. You can return an instance of
 * this class from your action's responder method to render a response with a custom status code,
 * headers, or body.
 *
 * @module denali
 * @submodule runtime
 */
export default class Response extends DenaliObject {

  /**
   * The HTTP status code to send in the response
   */
  public status: number;

  /**
   * The response body
   */
  public body: any;

  /**
   * Any custom options for this response. This object is available to the serializer as it attempts
   * to serialize this response, so you can pass through serializer specific options here.
   */
  public options: any;

  constructor(status: number, body: any, options: any = {}) {
    super();
    assert(isNumber(status), 'You must at least supply a status code when creating a response');
    this.status = status;
    this.body = body;
    this.options = options;
  }

  /**
   * The content type of the response. Set via the `options` argument of the Response constructor.
   */
  public get contentType(): string {
    return this.options.contentType || 'application/json';
  }
  public set contentType(value: string) {
    this.options.contentType = value;
  }

}
