import Promise from 'bluebird';
import { exec } from 'child_process';
import startCase from 'lodash/startCase';
import cmdExists from 'command-exists';
import ui from '../../lib/cli/ui';
import Blueprint from '../../lib/cli/blueprint';
import spinner from '../../lib/utils/spinner';
import pkg from '../../package.json';

const run = Promise.promisify(exec);
const commandExists = Promise.promisify(cmdExists);

export default class AddonBlueprint extends Blueprint {

  static blueprintName = 'addon';
  static description = 'Creates a new addon project, initializes git and installs dependencies';

  params = [ 'name' ];

  flags = {
    'skip-deps': {
      description: 'Do not install dependencies on new addon',
      defaultValue: false,
      type: Boolean
    },
    'use-npm': {
      description: 'Use npm to install dependencies, even if yarn is available',
      defaultValue: false,
      type: Boolean
    }
  }

  locals({ name }) {
    return {
      name,
      className: startCase(name).replace(/\s/g, ''),
      humanizedName: startCase(name),
      denaliVersion: pkg.version
    };
  }

  postInstall({ name }, flags) {
    ui.info('');
    spinner.start('Installing dependencies');
    return Promise.resolve().then(() => {
      if (!flags['skip-deps']) {
        return commandExists('yarn').then((yarnExists) => {
          if (yarnExists && !flags['use-npm']) {
            return run('yarn install', { cwd: name });
          }
          return run('npm install --loglevel=error', { cwd: name });
        }).then(() => {
          spinner.succeed();
        });
      }
    }).then(() => {
      spinner.start('Setting up git repo');
      return run('git init', { cwd: name });
    }).then(() => {
      return run('git add .', { cwd: name });
    }).then(() => {
      return run('git commit -am "Initial denali project scaffold"', { cwd: name });
    }).then(() => {
      spinner.succeed();
      ui.success('✨ ${ name } created');
    });
  }

}
