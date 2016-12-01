import { Response } from 'denali';
import ApplicationAction from '../application';

export default class Destroy<%= className %> extends ApplicationAction {

  async respond(params) {
    let <%= className %> = this.modelFor('<%= name %>');
    let <%= camelCased %> = await <%= className %>.find(params.id);
    await <%= camelCased %>.delete();
    return new Response(204);
  }

}
