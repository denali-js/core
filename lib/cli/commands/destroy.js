import Command from '../lib/command';

export default class DestroyCommand extends Command {

  /* eslint-disable max-len */
  description = 'Remove scaffolded code for your app. Only deletes files if they are identical to the scaffolded output - changed files are ignored.';
  /* eslint-enable max-len */

  params = [ 'blueprintName' ];

  flags = {};

  runsInApp = true;

  run(params) {
    this.startSpinner();
    const Blueprint = require(`../blueprints/${ params.blueprintName }`);
    let blueprint = new Blueprint();
    blueprint.destroy();
    this.stopSpinner();
  }

}
