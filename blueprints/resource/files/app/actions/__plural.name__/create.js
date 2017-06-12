import ApplicationAction from '../application';

export default class Create<%= singular.className %> extends ApplicationAction {

  async respond({ body }) {
    let post = await this.db.create('<%= singular.dasherized %>', body).save();
    this.render(201, post);
  }

}
