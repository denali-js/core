import unwrap from '../lib/utils/unwrap';
import * as Bluebird from 'bluebird';
import * as cmdExists from 'command-exists';
import { ui, spinner, Command, Project } from 'denali-cli';
import { exec } from 'child_process';

const run = Bluebird.promisify<[ string, string ], string>(exec);
const commandExists = Bluebird.promisify<boolean, string>(cmdExists);

export default class InstallCommand extends Command {

  static commandName = 'install';
  static description = 'Install an addon in your app.';
  static longDescription = unwrap`
    Installs the supplied addon in the project. Essentially a shortcut for
    \`npm install --save <addon>\`, with sanity checking that the project actually is
    a Denali addon.`;

  static runsInApp = true;

  static params = '<addonName>';

  async run(argv: any) {
    let pkgManager = await commandExists('yarn') ? 'yarn' : 'npm';
    try {
      let [ stdout, stderr ] = await run(`npm info ${ argv.addonName } --json`);

      let pkg = JSON.parse(stdout);
      let isAddon = pkg.keywords.includes('denali-addon');
      if (!isAddon) {
        return this.fail(`${ argv.addonName } is not a Denali addon.`);
      }

      spinner.start(`Installing ${ pkg.name }@${ pkg.version }`);
      let installCommand = pkgManager === 'yarn' ? 'yarn add --mutex network' : 'npm install --save';
      let [ , installStderr ] = await run(`${ installCommand } ${ argv.addonName }`);
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
