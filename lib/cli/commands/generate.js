import fs from 'fs';
import path from 'path';
import ui from '../lib/ui';
import Command from '../lib/command';

export default class GenerateCommand extends Command {

  description = 'Scaffold code for your app.';

  params = [ 'blueprintName' ];

  flags = {};

  runsInApp = true;

  run(params) {
    if (!params.blueprintName) {
      this.printHelp();
    } else {
      this.startSpinner();
      this.generateBlueprint(params.blueprintName);
      this.stopSpinner();
    }
  }

  generateBlueprint(blueprintName) {
    const Blueprint = require(`../blueprints/${ blueprintName }`);
    let blueprint = new Blueprint();
    blueprint.generate();
  }

  printHelp() {
    let blueprints = fs.readdirSync(path.join(__dirname, '..', 'blueprints'));
    blueprints.forEach((blueprintName) => {
      const Blueprint = require(`../blueprints/${ blueprintName }`);
      ui.info(blueprintName);
      ui.info(Blueprint.prototype.description);
    });
  }

}
