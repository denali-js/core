import ApplicationAction from '../application';
import <%= singular.className %> from '../../models/<%= singular.dasherized %>';

export default class List<%= plural.className %> extends ApplicationAction {

  async respond() {
    return await <%= singular.className %>.all();
  }

}
