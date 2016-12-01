import { Response } from 'denali';
import ApplicationAction from '../application';

export default class Create<%= className %> extends ApplicationAction {

  async respond(params) {
    let <%= className %> = this.modelFor('<%= name %>');
    let <%= camelCased %> = await <%= className %>.create(params);
    return new Response(201, <%= camelCased %>);
  }

}
