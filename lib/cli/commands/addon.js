import chalk from 'chalk';
import path from 'path';
import generate from '../utils/generate-blueprint';

let args = process.argv.slice(2);

// TODO - support arbitrary blueprint sources (i.e. local blueprint folder, git repo, etc)
generate({
  src: path.join(__dirname, '..', 'blueprints', 'addon'),
  dest: path.join(process.cwd(), args[0]),
  args
});

console.log(chalk.green(`\n${ args[0] } created!`));
