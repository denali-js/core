const { Service } = require('denali');

module.exports = class ConfigService extends Service {

  init() {
    this.name = 'dummy';
  }

}
