import path from 'path';
import chalk from 'chalk';
import program from 'commander';
import nodemon from 'nodemon';

program
  .option('-g --grep <regex filter>', 'Filter tests based on a regex pattern')
  .option('-e --environment <environment>', 'The environment to run in; defaults to "test"', 'test')
  .parse(process.argv);

let testsCommand = 'node ' + path.join(__dirname, 'run-tests.js');

if (program.grep) {
  testsCommand += ' --grep "' + program.grep + '"';
}

nodemon({
  exec: testsCommand,
  env: { NODE_ENV: program.environment },
  ignore: [ 'node_modules\/(?!denali)', 'node_modules/denali/node_modules' ]
});

nodemon.on('restart', function(files) {
  if (files) {
    console.log(`\nFiles changed:\n  ${ files.join('\n  ') }\nre-running ...\n`);
  } else {
    console.log('\nRe-running ...\n');
  }
});
nodemon.on('crash', function() {
  console.log(chalk.red.bold(`Tests crashed! Waiting for file changes to restart ...`));
});
nodemon.on('quit', () => {
  console.log('Goodbye!');
});
