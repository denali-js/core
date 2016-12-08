import path from 'path';
import dedent from 'dedent-js';
import Promise from 'bluebird';
import Command from '../lib/cli/command';
import { exec } from 'child_process';

const run = Promise.promisify(exec);

export default class PublishCommand extends Command {

  static commandName = 'publish';
  static description = 'Publish an addon to the npm registry.';
  static longDescription = dedent`
    Publishes an addon to the npm registry. Runs tests builds the
    addon, and publishes the dist/ directory to the registry.`;

  runsInApp = true;

  params = [];

  flags = {
    'skip-tests': {
      description: 'Do not run tests before publishing',
      defaultValue: false,
      type: Boolean
    }
  };

  async run({ flags }) {
    if (!flags['skip-tests']) {
      await this.runTests();
    }
    await this.build();
    await this.publish();
  }

  async runTests() {
    this.startSpinner('Running tests');
    try {
      await run('npm test');
    } catch (error) {
      this.stopSpinner('fail', 'Tests failed, halting publish');
      throw error;
    }
    this.stopSpinner('succeed', 'Tests passed');
  }

  async build() {
    this.startSpinner('Building');
    try {
      await run('npm run build');
    } catch (error) {
      this.stopSpinner('fail', 'Build failed, halting publish');
      throw error;
    }
    this.stopSpinner('succeed', 'Addon built');
  }

  async publish() {
    this.startSpinner('Publishing');
    try {
      await run('npm publish', { cwd: path.join(process.cwd(), 'dist') });
    } catch (error) {
      this.stopSpinner('fail', 'Publish failed');
      throw error;
    }
    let pkg = require(path.join(process.cwd(), 'package.json'));
    this.stopSpinner('succeed', `${ pkg.name } ${ pkg.version } published!`);
  }

}
