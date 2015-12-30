import chalk from 'chalk';
import path from 'path';
import program from 'commander';
import generate from '../../utils/generate-blueprint';

program
  .usage('<app name>')
  .description('Create a new denali app in the <app name> directory.')
  .parse(process.argv);

generate({
  src: path.join(__dirname, '..', 'blueprints', 'app'),
  dest: path.join(process.cwd(), program.args[0]),
  args: program.args
});

console.log(chalk.green(`\n${ program.args[0] } created!`));
