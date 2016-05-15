import assert from 'assert';
import isNumber from 'lodash/isNumber';

export default class Response {

  constructor(status, body, options = {}) {
    assert(isNumber(status), 'You must at least supply a status code when creating a response');
    this.status = status;
    this.body = body;
    this.options = options;
  }

  get contentType() {
    // TODO this default should be a config option
    return this.options.contentType || 'application/json';
  }

}
