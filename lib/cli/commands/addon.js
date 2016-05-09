import ui from '../lib/ui';
import Command from '../lib/command';

export default class AddonCommand extends Command {

  description = 'Create a new denali addon in the <addon name> directory.'

  params = [ 'name' ];

  flags = {};

  runsInApp = false;

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

}
