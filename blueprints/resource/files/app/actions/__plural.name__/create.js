import ApplicationAction from '../application';
import <%= singular.className %> from '../../models/<%= singular.dasherized %>';

export default class Create<%= singular.className %> extends ApplicationAction {

  async respond({ body }) {
    let <%= singular.camelCased %> = await <%= singular.className %>.create(body);
    this.render(201, <%= singular.camelCased %>);
  }

}
