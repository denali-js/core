const { Service } = require('denali');

module.exports = class ConfigService extends Service {

  constructor() {
    super(...arguments);
    this.name = 'dummy';
  }

}
