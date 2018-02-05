import ApplicationAction from '../application';
import <%= singular.className %> from '../../models/<%= singular.dasherized %>';

export default class Update<%= singular.className %> extends ApplicationAction {

  async respond({ params, body }) {
    let <%= singular.camelCased %> = await <%= singular.className %>.find(params.id);
    Object.assign(<%= singular.camelCased %>, body);
    return await <%= singular.camelCased %>.save();
  }

}
