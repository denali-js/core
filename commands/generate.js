import fs from 'fs';
import path from 'path';
import ui from '../lib/cli/ui';
import dedent from 'dedent-js';
import Command from '../lib/cli/command';
import Project from '../lib/cli/project';
import Blueprint from '../lib/cli/blueprint';
import padEnd from 'lodash/padEnd';

export default class GenerateCommand extends Command {

  static commandName = 'generate';
  static description = 'Scaffold code for your app.';
  static longDescription = dedent`
    Generates code from the given blueprint. Blueprints are templates used by the
    generate command, but they can go beyond simple templating (i.e. installing
    addons).`;

  params = [ 'blueprintName', 'otherArgs' ];

  flags = {};

  runsInApp = true;

  allowExtraArgs = true;

  run({ params }, argTokens) {
    if (!params.blueprintName) {
      this.printHelp();
    } else {
      let project = new Project();
      let blueprint = Blueprint.instanceFor(project, params.blueprintName);
      if (!blueprint) {
        ui.error(`No blueprint called ${ params.blueprintName } was found.`);
      } else {
        let args = this.parseArgs.call(blueprint, argTokens.slice(1));
        blueprint.generate(args);
      }
    }
  }

  printHelp() {
    super.printHelp();
    ui.info('Available Blueprints:');
    let blueprints = fs.readdirSync(path.join(__dirname, '..', 'blueprints'));
    let pad = blueprints.reduce((length, name) => Math.max(length, name.length), 0);
    blueprints.forEach((blueprintName) => {
      const BlueprintClass = require(`../blueprints/${ blueprintName }`).default;
      ui.info(`  ${ padEnd(blueprintName, pad) }  ${ BlueprintClass.description }`);
    });
  }

}
