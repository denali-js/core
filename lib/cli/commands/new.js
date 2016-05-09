import ui from '../lib/ui';
import Command from '../lib/command';

export default class NewCommand extends Command {

  description = 'Create a new denali app in the <app name> directory.';

  params = [ 'name' ];

  flags = {};

  run(params) {
    this.startSpinner();
    if (!params.name) {
      ui.error('You must supply an app name');
      process.exit(1);
    }
    const Blueprint = require('../blueprints/app');
    let blueprint = new Blueprint();
    blueprint.generate();
    this.stopSpinner();
  }

}

