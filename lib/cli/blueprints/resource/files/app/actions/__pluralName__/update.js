import { Errors } from 'denali';
import ApplicationAction from '../application';

export default class Update<%= name %> extends ApplicationAction {

  respond(params) {
    return new Errors.NotImplemented();
  }

}
