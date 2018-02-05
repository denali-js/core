import ApplicationAction from '../application';
import <%= singular.className %> from '../../models/<%= singular.dasherized %>';

export default class Show<%= singular.className %> extends ApplicationAction {

  async respond({ params }) {
    return await <%= singular.className %>.find(params.id);
  }

}
