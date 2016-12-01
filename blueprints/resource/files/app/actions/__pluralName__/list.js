import ApplicationAction from '../application';

export default class List<%= className %> extends ApplicationAction {

  async respond() {
    let <%= className %> = this.modelFor('<%= name %>');
    return <%= className %>.find();
  }

}
