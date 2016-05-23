import { Response } from 'denali';
import ApplicationAction from '../application';

export default class Destroy<%= className %> extends ApplicationAction {

  respond(params) {
    let <%= className %> = this.modelFor('<%= name %>');
    return <%= className %>.find(params.id)
      .then((<%= name %>) => <%= name %>.delete())
      .then(() => new Response(204));
  }

}
