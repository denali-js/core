const ApplicationAction = require('./application');

module.exports = class IndexAction extends ApplicationAction {

  respond() {
    this.render({ message: 'Welcome to Denali!' }, { serializer: 'raw' });
  }

};