import ApplicationAction from '../application';
import <%= singular.className %> from '../../models/<%= singular.dasherized %>';

export default class Destroy<%= singular.className %> extends ApplicationAction {

  async respond({ params }) {
    let <%= singular.camelCased %> = await <%= singular.className %>.find(params.id);
    await <%= singular.camelCased %>.destroy();
    this.render(204);
  }

}
