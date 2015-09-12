// import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { isDenaliApp } from '../utils';
import { generate } from './tasks/blueprint';

let args = process.argv.slice(2);

let generatorCommand = args.shift();

if (generatorCommand === 'app') {
  console.error(chalk.red('Try denali new [my app name] instead.'));
} else {
  if (isDenaliApp(process.cwd())) {
    generate({
      src: path.join(__dirname, '../../generators', generatorCommand),
      dest: process.cwd(),
      args: args
    });
  } else {
    console.error(chalk.red('You must be inside a Denali application to run the generate command.'));
  }
}
