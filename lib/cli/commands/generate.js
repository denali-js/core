import path from 'path';
import chalk from 'chalk';
import program from 'commander';
import isDenaliApp from '../../utils/is-denali-app';
import generate from '../../utils/generate-blueprint';

program
  .usage('<blueprint> <name>')
  .description('Scaffold code for your app.')
  .parse(process.argv);

let [ blueprintName, instanceName ] = program.args;

if (blueprintName === 'app') {
  console.error(chalk.red(`Try denali new ${ instanceName } instead.`));
} else if (blueprintName === 'addon') {
  console.error(chalk.red(`Try denali addon ${ instanceName } instead.`));
} else {
  if (isDenaliApp(process.cwd())) {
    generate({
      src: path.join(__dirname, '..', 'blueprints', blueprintName),
      dest: process.cwd(),
      args: program.args
    });
    console.log(chalk.green(`\n${ instanceName } ${ blueprintName } created!`));
  } else {
    console.error(chalk.red('You must be inside a Denali application to run the generate command.'));
  }
}
