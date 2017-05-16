import ApplicationAction from '../application';

export default class Show<%= singular.className %> extends ApplicationAction {

  async respond({ params }) {
    return this.db.find('<%= singular.dasherized %>', params.id);
  }

}
