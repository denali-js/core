import ApplicationAction from './application';

export default class IndexAction extends ApplicationAction {

  respond() {
    this.render(200, { message: 'Welcome to Denali!' }, { serializer: 'raw' });
  }

}
