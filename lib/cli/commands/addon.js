const ui = require('../lib/ui');
const Command = require('../lib/command');

module.exports = Command.extend({

  description: 'Create a new denali addon in the <addon name> directory.',

  params: [ 'name' ],

  flags: {},

  runsInApp: false,

  run(params) {
    this.startSpinner();
    if (!params.name) {
      ui.error('You must supply an addon name');
      process.exit(1);
    }
    const Blueprint = require('../blueprints/addon');
    let blueprint = new Blueprint();
    blueprint.generate();
    this.stopSpinner();
  }

});
