import unwrap from '../lib/utils/unwrap';
import * as Bluebird from 'bluebird';
import * as cmdExists from 'command-exists';
import { ui, spinner, Command, Project, Blueprint } from 'denali-cli';
import { exec } from 'child_process';

const run = Bluebird.promisify<[ string, string ], string>(exec);
const commandExists = Bluebird.promisify<boolean, string>(cmdExists);

/**
 * Install an addon in your app.
 *
 * @package commands
 */
export default class InstallCommand extends Command {

  /* tslint:disable:completed-docs typedef */
  public static commandName = 'install';
  public static description = 'Install an addon in your app.';
  public static longDescription = unwrap`
    Installs the supplied addon in the project. Essentially a shortcut for \`npm install --save
    <addon>\`, with sanity checking that the project actually is a Denali addon.`;

  public static runsInApp = true;

  public static params = '<addonName>';

  public async run(argv: any) {
    try {
      await this.installAddon(argv.addonName);
    } catch (err) {
      await this.fail(err);
    }
  }

  public async installAddon(addonName: string) {
    // Find the package info first to confirm it exists and is a denali addon
    let pkgManager = await commandExists('yarn') ? 'yarn' : 'npm';
    let [ stdout, stderr ] = await run(`npm info ${ addonName } --json`);
    let pkg = JSON.parse(stdout);
    let isAddon = pkg.keywords.includes('denali-addon');
    if (!isAddon) {
      await this.fail(`${ addonName } is not a Denali addon.`);
      return;
    }

    // Install the package
    await spinner.start(`Installing ${ pkg.name }@${ pkg.version }`);
    let installCommand = pkgManager === 'yarn' ? 'yarn add --mutex network' : 'npm install --save';
    let [ , installStderr ] = await run(`${ installCommand } ${ addonName }`);
    if (installStderr) {
      ui.warn(installStderr);
    }

    // Run the installation blueprint
    let blueprints = Blueprint.findBlueprints(true);
    if (blueprints[addonName]) {
      let blueprint = new blueprints[addonName]();
      await blueprint.generate({});
    }

    await spinner.succeed();
  }

  private async fail(msg: string) {
    ui.error(msg);
    await spinner.fail('Install failed');
    await process.exit(1);
  }

}
