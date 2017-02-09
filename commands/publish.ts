import path from 'path';
import dedent from 'dedent-js';
import Bluebird from 'bluebird';
import Command, { CommandOptions } from '../lib/cli/command';
import spinner from '../lib/utils/spinner';
import { exec, ExecOptions } from 'child_process';

const run = Bluebird.promisify<[ string, string ], string, ExecOptions>(exec);

export default class PublishCommand extends Command {

  static commandName = 'publish';
  static description = 'Publish an addon to the npm registry.';
  static longDescription = dedent`
    Publishes an addon to the npm registry. Runs tests builds the
    addon, and publishes the dist/ directory to the registry.`;

  runsInApp = true;

  params: string[] = [];

  flags = {
    'skip-tests': {
      description: 'Do not run tests before publishing',
      defaultValue: false,
      type: Boolean
    }
  };

  async run(options: CommandOptions) {
    await this.build();
    if (!options.flags['skip-tests']) {
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
