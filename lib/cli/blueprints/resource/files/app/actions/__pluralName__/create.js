import { Errors } from 'denali';
import ApplicationAction from '../application';

export default class Create<%= name %> extends ApplicationAction {

  respond(params) {
    return new Errors.NotImplemented();
  }

}
