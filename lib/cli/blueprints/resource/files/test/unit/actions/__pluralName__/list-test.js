import { Errors } from 'denali';
import ApplicationAction from '../application';

export default ApplicationAction.extend({

  respond(params) {
    this.render(new Errors.NotImplemented());
  }

});
