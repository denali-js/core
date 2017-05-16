import ApplicationAction from '../application';

export default class List<%= plural.className %> extends ApplicationAction {

  async respond() {
    return await this.db.all('<%= singular.dasherized %>');
  }

}
