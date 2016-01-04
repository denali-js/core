import { execSync as run } from 'child_process';
import chalk from 'chalk';

export default {
  locals(args) {
    return {
      name: args[0]
    };
  },
  postInstall({ name }) {
    console.log('');
    console.log(chalk.green('Installing npm dependencies ...'));
    run('npm install --loglevel=error');
    console.log(chalk.green('Setting up git repo ...'));
    run('git init');
    run('git add .');
    run('git commit -am "Initial denali addon scaffold"');
    console.log('');
    console.log('');
    console.log(chalk.green.bold('Installation complete!'));
    console.log('To launch a dummy application that uses this addon, just run:');
    console.log('');
    console.log(`  $ cd ${ name } && denali server`);
    console.log('');
  }
};
