import { Errors } from 'denali';
import ApplicationAction from '../application';

export default class Destroy<%= name %> extends ApplicationAction {

  respond(params) {
    return new Errors.NotImplemented();
  }

}
