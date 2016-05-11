import assert from 'assert';
import isNumber from 'lodash/isNumber';

export default class Response {

  constructor(status, body, options = {}) {
    assert(isNumber(status), 'You must at least supply a status code when creating a response');
    this.status = status;
    this.body = body;
    this.options = options;
  }

}
