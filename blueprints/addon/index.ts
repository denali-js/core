import * as Bluebird from 'bluebird';
import { exec, ExecOptions } from 'child_process';
import {
  startCase
} from 'lodash';
import * as cmdExists from 'command-exists';
import { Blueprint, ui, spinner } from 'denali-cli';
import pkg from '../../package.json';
import unwrap from '../../lib/utils/unwrap';

const run = Bluebird.promisify<[ string, string ], string, ExecOptions>(exec);
const commandExists = Bluebird.promisify<boolean, string>(cmdExists);

export default class AddonBlueprint extends Blueprint {

  static blueprintName = 'addon';
  static description = 'Creates a new addon project, initializes git and installs dependencies';
  static longDescription = unwrap`
    Usage: denali generate addon <name> [options]

    Scaffolds a new addon. Sets up the correct directory structure, initializes a git repo, and
    installs the necessary dependencies.

    Guides: http://denali.js.org/master/guides/utilities/addons/
  `;

  static params = '<name>';

  static flags = {
    'skip-deps': {
      description: 'Do not install dependencies on new addon',
      defaultValue: false,
      type: <any>'boolean'
    },
    'use-npm': {
      description: 'Use npm to install dependencies, even if yarn is available',
      defaultValue: false,
      type: <any>'boolean'
    }
  }

  locals(argv: any) {
    let name = argv.name;
    return {
      name,
      className: startCase(name).replace(/\s/g, ''),
      humanizedName: startCase(name),
      denaliVersion: pkg.version
    };
  }

  async postInstall(argv: any) {
    let name = argv.name;
    ui.info('');
    spinner.start('Installing dependencies');
    if (!argv.skipDeps) {
      let yarnExists: boolean = await commandExists('yarn');
      if (yarnExists && !argv.useNpm) {
        await run('yarn install', { cwd: name });
      } else {
        await run('npm install --loglevel=error', { cwd: name });
      }
    }
    spinner.succeed();
    spinner.start('Setting up git repo');
    await run('git init', { cwd: name });
    await run('git add .', { cwd: name });
    await run('git commit -am "Initial denali project scaffold"', { cwd: name });
    spinner.succeed();
    spinner.finish('✨', `${ name } created`);
  }

}
