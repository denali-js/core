// import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { isDenaliApp } from '../utils';
import destroy from './utils/destroy-blueprint';

let args = process.argv.slice(2);

let generatorCommand = args.shift();

if (generatorCommand === 'app') {
  console.error(chalk.red('To destroy an app, just delete the root folder.'));
} else {
  if (isDenaliApp(process.cwd())) {
    destroy({
      src: path.join(__dirname, '..', 'blueprints', generatorCommand),
      dest: process.cwd(),
      args
    });
  } else {
    console.error(chalk.red('You must be inside a Denali application to run the generate command.'));
  }
}
