import ApplicationAction from '../application';

export default class Update<%= singular.className %> extends ApplicationAction {

  async respond(params) {
    let <%= singular.className %> = this.modelFor('<%= singular.name %>');
    let <%= singular.camelCased %> = await <%= singular.className %>.findOne(params.id);
    Object.assign(<%= singular.camelCased %>, params);
    return <%= singular.camelCased %>.save();
  }

}
