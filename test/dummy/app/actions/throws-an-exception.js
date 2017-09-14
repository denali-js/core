const ApplicationAction = require('./application');

module.exports = class IndexAction extends ApplicationAction {

  respond() {
    throw new Error('some-error');
  }

};