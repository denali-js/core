import ui from '../../lib/ui';
import ora from 'ora';
import Blueprint from '../../lib/blueprint';
import Promise from 'bluebird';
import { exec } from 'child_process';
import startCase from 'lodash/startCase';
import pkg from '../../../../package.json';

const run = Promise.promisify(exec);
const maxBuffer = 400 * 1024;

export default class AppBlueprint extends Blueprint {

  static blueprintName = 'app';
  static description = 'Creates a new app, initializes git and installs dependencies';

  params = [ 'name' ];

  locals({ name }) {
    return {
      name,
      className: startCase(name).replace(/\s/g, ''),
      humanizedName: startCase(name),
      denaliVersion: pkg.version
    };
  }

  postInstall({ name }) {
    let spinner = ora();
    ui.info('');
    spinner.text = 'Installing npm dependencies ...';
    spinner.start();
    run('npm install --loglevel=error', { cwd: name, maxBuffer }).then(() => {
      spinner.stop();
      ui.success('Installing npm dependencies ... done ✔');
      spinner.text = 'Setting up git repo ...';
      spinner.start();
      return run('git init', { cwd: name, maxBuffer });
    }).then(() => {
      return run('git add .', { cwd: name, maxBuffer });
    }).then(() => {
      return run('git commit -am "Initial denali project scaffold"', { cwd: name, maxBuffer });
    }).then(() => {
      spinner.stop();
      ui.success('Setting up git repo ... done ✔');
      ui.success('🏔 Installation complete!');
      ui.info('');
      ui.info('To launch your application, just run:');
      ui.info('');
      ui.info(`  $ cd ${ name } && denali server`);
      ui.info('');
    });
  }

}
