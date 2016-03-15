import chalk from 'chalk';
import program from 'commander';
import findup from 'findup-sync';

let pkg = require(findup('package.json', { cwd: __dirname }));

process.argv[2] = process.argv[2] || 'help';

program.version(pkg.version)
  .command('new', 'scaffold a new denali project')
  .command('server', 'run the denali app server')
  .command('test', 'run the test suite, and optionally re-run on changes')
  .command('generate', 'generate boilerplate code from templates')
  .command('destroy', 'remove scaffolding created by the generate command')
  .command('build', 'build your denali app or addon')
  .command('install', 'install a Denali addon')
  .command('addon', 'scaffold a new denali addon');

let result = program.parse(process.argv);

if (result) {
  console.log(chalk.red.bold(`\nCommand "${ process.argv[2] }" not recognized`));
  program.outputHelp();
}
