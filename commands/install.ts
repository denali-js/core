import * as Bluebird from 'bluebird';
import * as cmdExists from 'command-exists';
import { ui, spinner, Command, Blueprint, unwrap } from '@denali-js/cli';
import { execSync as run } from 'child_process';
import * as createDebug from 'debug';

const commandExists = Bluebird.promisify<boolean, string>(cmdExists);
const debug = createDebug('denali:commands:install');

/**
 * Install an addon in your app.
 *
 * @package commands
 */
export default class InstallCommand extends Command {

  /* tslint:disable:completed-docs typedef */
  static commandName = 'install';
  static description = 'Install an addon in your app.';
  static longDescription = unwrap`
    Installs the supplied addon in the project. Essentially a shortcut for \`npm install --save
    <addon>\`, with sanity checking that the project actually is a Denali addon.`;

  static runsInApp = true;

  static params = '<addonName>';

  async run(argv: any) {
    try {
      await this.installAddon(argv.addonName);
    } catch (err) {
      await this.fail(err.stack || err);
    }
  }

  async installAddon(addonName: string) {
    debug(`attempting to install ${ addonName }`);
    // Find the package info first to confirm it exists and is a denali addon
    let pkgManager = await commandExists('yarn') ? 'yarn' : 'npm';
    debug(`package manager is: ${ pkgManager }`);
    await spinner.start(`Searching for "${ addonName }" addon ...`);
    let pkgInfo;
    let pkg;
    try {
      pkgInfo = run(`npm info ${ addonName } --json`);
      pkg = JSON.parse(pkgInfo.toString());
      debug(`package info lookup succeeded, latest version is: ${ pkg['dist-tags'].latest }`);
    } catch (e) {
      this.fail('Lookup failed: ' + e.stack);
    }
    let isAddon = pkg.keywords.includes('denali-addon');
    if (!isAddon) {
      debug('package is not a denali addon, bailing');
      this.fail(`${ addonName } is not a Denali addon.`);
    }
    debug('package is an addon, continuing');
    await spinner.succeed('Addon package found');

    // Install the package
    await spinner.start(`Installing ${ pkg.name }@${ pkg.version }`);
    let installCommand = pkgManager === 'yarn' ? 'yarn add --mutex network' : 'npm install --save';
    debug(`installing with ${ installCommand }`);
    try {
      run(`${ installCommand } ${ addonName }`, { stdio: 'pipe' });
    } catch (e) {
      this.fail('Install failed: ' + e.stack);
    }
    await spinner.succeed('Addon package installed');

    // Run the installation blueprint
    let blueprints = Blueprint.findBlueprints(true);
    if (blueprints[addonName]) {
      ui.info('Running default blueprint for addon');
      let blueprint = new blueprints[addonName]();
      await blueprint.generate({});
      await spinner.succeed('Addon installed');
    }

  }

  protected async fail(msg: string) {
    await spinner.fail(`Install failed: ${ msg }`);
    process.exit(1);
  }

}
