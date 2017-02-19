const ApplicationAction = require('./application');

module.exports = class IndexAction extends ApplicationAction {

  constructor() {
    super(...arguments);
    this.serializer = false;
  }

  respond() {
    return { message: 'Welcome to Denali!' };
  }

};