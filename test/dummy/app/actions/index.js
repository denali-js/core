const ApplicationAction = require('./application');

module.exports = class IndexAction extends ApplicationAction {

  respond() {
    this.render({ hello: 'world' }, { serializer: 'json' });
  }

};