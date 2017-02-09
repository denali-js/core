import Bluebird from 'bluebird';
import { exec, ExecOptions } from 'child_process';
import {
  startCase
} from 'lodash';
import cmdExists from 'command-exists';
import { Blueprint, ui, spinner } from 'denali-cli';
import pkg from '../../package.json';

const run = Bluebird.promisify<[ string, string ], string, ExecOptions>(exec);
const commandExists = Bluebird.promisify<boolean, string>(cmdExists);

export default class AddonBlueprint extends Blueprint {

  static blueprintName = 'addon';
  static description = 'Creates a new addon project, initializes git and installs dependencies';

  static params = '<name>';

  flags = {
    'skip-deps': {
      description: 'Do not install dependencies on new addon',
      defaultValue: false,
      type: 'boolean'
    },
    'use-npm': {
      description: 'Use npm to install dependencies, even if yarn is available',
      defaultValue: false,
      type: 'boolean'
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
