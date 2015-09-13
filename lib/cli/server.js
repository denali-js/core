import path from 'path';
import chalk from 'chalk';
import cp from 'child_process';
import assign from 'lodash-node/modern/object/assign';
import program from 'commander';
import nodemon from 'nodemon';

program
.option('-e --environment', 'The environment to run under, i.e. "production"', 'development')
.option('-d --debug', 'Runs the server with the node --debug flag, and launches node-inspector')
.option('-p --port', 'The port to bind to on localhost', parseInt, 3000)
.parse(process.argv);

let serverPath = path.join(__dirname, 'tasks/serve.js');

if (program.environment === 'development') {

  if (program.debug) {
    cp.exec('node-inspector');
    cp.exec('open http://127.0.0.1:8080/debug?port=5858');
  }

  nodemon({
    script: serverPath,
    ignore: [ 'node_modules\/(?!denali)', 'node_modules/denali/node_modules' ],
    debug: program.debug
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
