import chalk from 'chalk';
import program from 'commander';
import isDenaliApp from '../is-denali-app';
import cp from 'child_process';
import Promise from 'bluebird';

Promise.promisifyAll(cp);

program
  .usage('<addon name>')
  .description('Install a denali addon into your app.')
  .parse(process.argv);

let [ addonName ] = program.args;

if (isDenaliApp(process.cwd())) {
  cp.execAsync(`npm info ${ addonName }`)
  .then(([ stdout, stderr ]) => {
    if (stderr.length > 0) {
      if (stderr.match(/Registry returned 404/)) {
        return Promise.reject(new Error('Addon not found - no such npm module exists'));
      }
      return Promise.reject(new Error(stderr));
    }
    let pkg = JSON.parse(stdout);
    let isAddon = pkg.keywords.indexOf('denali-addon') > -1;
    if (!isAddon) {
      return Promise.reject(new Error(`${ addonName } is not a Denali addon.`));
    }
    return cp.execAsync(`npm install --save ${ addonName }`);
  }).catch((err) => {
    console.error(chalk.red(err));
    process.exit(1);
  });
} else {
  console.error(chalk.red('You must be inside a Denali application to install an addon.'));
}
