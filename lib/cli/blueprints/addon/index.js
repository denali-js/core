import ui from '../../lib/ui';
import Blueprint from '../../lib/blueprint';
import { execSync as run } from 'child_process';

export default class AddonBlueprint extends Blueprint {

  static blueprintName = 'addon';
  static description = "Creates a new addon project, initializes git and installs dependencies";

  params = [ 'name' ];

  postInstall({ name }) {
    ui.info('');
    ui.info('Installing npm dependencies ...');
    run('npm install --loglevel=error');
    ui.info('Setting up git repo ...');
    run('git init');
    run('git add .');
    run('git commit -am "Initial denali addon scaffold"');
    ui.info('');
    ui.info('');
    ui.success('Installation complete!');
    ui.info('To launch a dummy application that uses this addon, just run:');
    ui.info('');
    ui.info(`  $ cd ${ name } && denali server`);
    ui.info('');
  }

}
