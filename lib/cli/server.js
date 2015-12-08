import path from 'path';
import chalk from 'chalk';
import cp from 'child_process';
import assign from 'lodash/object/assign';
import not from 'lodash/function/negate';
import filter from 'lodash/collection/filter';
import isEmpty from 'lodash/lang/isEmpty';
import program from 'commander';
import nodemon from 'nodemon';

program
.option('-e --environment <environment>', 'The environment to run under, i.e. "production"', String)
.option('-d --debug', 'Runs the server with the node --debug flag, and launches node-inspector')
.option('-p, --port <port>', 'Sets the port that the server will listen on')
.parse(process.argv);

let serverPath = path.join(process.cwd(), 'index.js');

if (program.environment === 'development' || !program.environment) {

  if (program.debug) {
    cp.exec('node-inspector');
    cp.exec('open http://127.0.0.1:8080/debug?port=5858');
  }

  let env = process.env;
  env = assign({
    DENALI_ENV: program.environment,
    PORT: program.port
  }, env);
  env = filter(env, not(isEmpty));

  nodemon({
    script: serverPath,
    ignore: [ 'node_modules\/(?!denali)', 'node_modules/denali/node_modules' ],
    debug: program.debug,
    env: env
  });

  nodemon.on('quit', function() {
    console.log('Goodbye!');
  });
  nodemon.on('restart', function(files) {
    console.log(`\nFiles changed:\n  ${ files.join('\n  ') }\nrestarting ...\n`);
  });
  nodemon.on('crash', function() {
    console.log(chalk.red.bold(`Server crashed! Waiting for file changes to restart ...`));
  });

} else {

  let spawnOptions = {
    stdio: 'inherit',
    env: assign({
      DENALI_ENV: program.environment,
      PORT: program.port
    }, process.env)
  };

  cp.spawn('node', [ serverPath ], spawnOptions);

}
