import * as path from 'path';
import unwrap from '../lib/utils/unwrap';
import * as Bluebird from 'bluebird';
import { ui, spinner, Command, Project } from 'denali-cli';
import { exec, ExecOptions } from 'child_process';

const run = Bluebird.promisify<[ string, string ], string, ExecOptions>(exec);

export default class PublishCommand extends Command {

  static commandName = 'publish';
  static description = 'Publish an addon to the npm registry.';
  static longDescription = unwrap`
    Publishes an addon to the npm registry. Runs tests builds the
    addon, and publishes the dist/ directory to the registry.`;

  static runsInApp = true;

  static flags = {
    skipTests: {
      description: 'Do not run tests before publishing',
      defaultValue: false,
      type: <any>'boolean'
    }
  };

  async run(argv: any) {
    await this.build();
    if (!argv.skipTests) {
      await this.runTests();
    }
    await this.publish();
  }

  async runTests() {
    spinner.start('Running tests');
    try {
      await run('npm test', {});
    } catch (error) {
      spinner.fail('Tests failed, halting publish');
      throw error;
    }
    spinner.succeed('Tests passed');
  }

  async build() {
    spinner.start('Building');
    try {
      await run('npm run build', {});
    } catch (error) {
      spinner.fail('Build failed, halting publish');
      throw error;
    }
    spinner.succeed('Addon built');
  }

  async publish() {
    spinner.start('Publishing');
    try {
      await run('npm publish', { cwd: path.join(process.cwd(), 'dist') });
    } catch (error) {
      spinner.fail('Publish failed');
      throw error;
    }
    let pkg = require(path.join(process.cwd(), 'package.json'));
    spinner.succeed(`${ pkg.name } ${ pkg.version } published!`);
  }

}
