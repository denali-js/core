import Command from '../lib/command';

export default class DestroyCommand extends Command {

  static commandName = 'destroy';
  static description = 'Remove scaffolded code from your app';
  static longDescription = `
Removes the code generated during a \`denali generate\` command. Errs on the
side of caution when deleting code - it will only remove files that exactly
match the generated output. Modified files will be left untouched.
  `;

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
