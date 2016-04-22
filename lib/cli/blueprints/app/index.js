const ui = require('../lib/ui');
const Blueprint = require('../../lib/blueprint');
const run = require('child_process').execSync;

module.exports = Blueprint.extend({
  locals(args) {
    return {
      name: args[0]
    };
  },
  postInstall({ name }) {
    ui.info('');
    ui.info('Installing npm dependencies ...');
    run('npm install --loglevel=error');
    ui.info('Setting up git repo ...');
    run('git init');
    run('git add .');
    run('git commit -am "Initial denali project scaffold"');
    ui.info('');
    ui.info('');
    ui.success('Installation complete!');
    ui.info('To launch your application, just run:');
    ui.info('');
    ui.info(`  $ cd ${ name } && denali server`);
    ui.info('');
  }
});
