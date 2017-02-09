import dedent from 'dedent-js';
import Bluebird from 'bluebird';
import cmdExists from 'command-exists';
import ui from '../lib/cli/ui';
import Command, { CommandOptions } from '../lib/cli/command';
import { exec } from 'child_process';
import spinner from '../lib/utils/spinner';

const run = Bluebird.promisify<[ string, string ], string>(exec);
const commandExists = Bluebird.promisify<boolean, string>(cmdExists);

export default class InstallCommand extends Command {

  static commandName = 'install';
  static description = 'Install an addon in your app.';
  static longDescription = dedent`
    Installs the supplied addon in the project. Essentially a shortcut for
    \`npm install --save <addon>\`, with sanity checking that the project actually is
    a Denali addon.`;

  runsInApp = true;

  params = [ 'addonName' ];

  flags = {};

  async run(options: CommandOptions) {
    let pkgManager = await commandExists('yarn') ? 'yarn' : 'npm';
    try {
      let [ stdout, stderr ] = await run(`npm info ${ options.params.addonName } --json`);

      let pkg = JSON.parse(stdout);
      let isAddon = pkg.keywords.includes('denali-addon');
      if (!isAddon) {
        return this.fail(`${ options.params.addonName } is not a Denali addon.`);
      }

      spinner.start(`Installing ${ pkg.name }@${ pkg.version }`);
      let installCommand = pkgManager === 'yarn' ? 'yarn add --mutex network' : 'npm install --save';
      let [ , installStderr ] = await run(`${ installCommand } ${ options.params.addonName }`);
      ui.warn(installStderr);
      spinner.succeed();
    } catch (err) {
      return this.fail(err);
    }
  }

  fail(msg: string) {
    ui.error(msg);
    spinner.fail('Install failed');
    process.exit(1);
  }

}
