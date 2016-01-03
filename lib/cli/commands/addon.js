import chalk from 'chalk';
import path from 'path';
import program from 'commander';
import generate from '../generate-blueprint';

program
  .usage('<addon name>')
  .description('Create a new denali addon in the <addon name> directory.')
  .parse(process.argv);

generate({
  src: path.join(__dirname, '..', 'blueprints', 'addon'),
  dest: path.join(process.cwd(), program.args[0]),
  args: program.args
});

console.log(chalk.green(`\n${ program.args[0] } created!`));
