import ApplicationAction from '../application';

export default class Update<%= className %> extends ApplicationAction {

  respond(params) {
    let <%= className %> = this.modelFor('<%= name %>');
    return <%= className %>.find(params.id)
      .then((<%= name %>) => {
        Object.assign(<%= name %>, params);
        return <%= name %>.save();
      });
  }

}
