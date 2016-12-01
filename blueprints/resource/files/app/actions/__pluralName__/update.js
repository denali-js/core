import ApplicationAction from '../application';

export default class Update<%= className %> extends ApplicationAction {

  async respond(params) {
    let <%= className %> = this.modelFor('<%= name %>');
    let <%= camelCased %> = await <%= className %>.find(params.id);
    Object.assign(<%= camelCased %>, params);
    return <%= camelCased %>.save();
  }

}
