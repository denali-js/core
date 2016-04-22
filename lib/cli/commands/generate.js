const fs = require('fs');
const path = require('path');
const ui = require('../lib/ui');
const Command = require('../lib/command');

module.exports = Command.extend({

  description: 'Scaffold code for your app.',

  params: [ 'blueprintName' ],

  flags: {},

  runsInApp: true,

  run(params) {
    if (!params.blueprintName) {
      this.printHelp();
    } else {
      this.generateBlueprint(params.blueprintName);
    }
  },

  generateBlueprint(blueprintName) {
    const Blueprint = require(`../blueprints/${ blueprintName }`);
    let blueprint = new Blueprint();
    blueprint.generate();
  },

  printHelp() {
    let blueprints = fs.readdirSync(path.join(__dirname, '..', 'blueprints'));
    blueprints.forEach((blueprintName) => {
      const Blueprint = require(`../blueprints/${ blueprintName }`);
      ui.info(blueprintName);
      ui.info(Blueprint.prototype.description);
    });
  }

});
