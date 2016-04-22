const ui = require('../lib/ui');
const Command = require('../lib/command');

module.exports = Command.extend({

  description: 'Create a new denali app in the <app name> directory.',

  params: [ 'name' ],

  flags: {},

  run(params) {
    if (!params.name) {
      ui.error('You must supply an app name');
      process.exit(1);
    }
    const Blueprint = require('../blueprints/app');
    const blueprint = new Blueprint();
    blueprint.generate();
  }

});

