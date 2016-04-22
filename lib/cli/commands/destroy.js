const Command = require('../lib/command');

module.exports = Command.extend({

  /* eslint-disable max-len */
  description: 'Remove scaffolded code for your app. Only deletes files if they are identical to the scaffolded output - changed files are ignored.',
  /* eslint-enable max-len */

  params: [ 'blueprintName' ],

  flags: {},

  runsInApp: true,

  run(params) {
    const Blueprint = require(`../blueprints/${ params.blueprintName }`);
    let blueprint = new Blueprint();
    blueprint.destroy();
  }

});
