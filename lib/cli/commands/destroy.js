import path from 'path';
import chalk from 'chalk';
import program from 'commander';
import isDenaliApp from '../is-denali-app';
import destroy from '../destroy-blueprint';

program
  .usage('<blueprint> <name>')
  .description('Remove scaffolded code for your app. Only deletes files if they\nare identical to the scaffolded output - changed files are ignored.')
  .parse(process.argv);

let [ blueprintName, instanceName ] = program.args;

if (blueprintName === 'app') {
  console.error(chalk.red('To destroy an app, just delete the root folder.'));
} else if (blueprintName === 'addon') {
  console.error(chalk.red('To remove an addon from an app, just remove it from your package.json.'));
} else {
  if (isDenaliApp(process.cwd())) {
    destroy({
      src: path.join(__dirname, '..', 'blueprints', blueprintName),
      dest: process.cwd(),
      args: program.args.slice(1)
    });
    console.log(chalk.green(`\n${ instanceName } ${ blueprintName } removed!`));
  } else {
    console.error(chalk.red('You must be inside a Denali application to run the destroy command.'));
  }
}
