const ui = require('../lib/ui');
const Command = require('../lib/command');
const exec = require('child_process').exec;

module.exports = Command.extend({

  description: 'Install a denali addon in your app.',

  params: [ 'addonName' ],

  flags: {},

  runsInApp: true,

  run(params) {
    exec(`npm info ${ params.addonName }`, (err, stdout, stderr) => {
      if (err) {
        return this.fail(err);
      }
      if (stderr.length > 0) {
        if (stderr.match(/Registry returned 404/)) {
          return this.fail(`'${ params.addonName }' not found - no such npm module exists`);
        }
        return this.fail(stderr);
      }

      const pkg = JSON.parse(stdout);
      const isAddon = pkg.keywords.includes('denali-addon');
      if (!isAddon) {
        return this.fail(`${ params.addonName } is not a Denali addon.`);
      }

      this.installAddon(params.addonName);
    });
  },

  installAddon(addonName) {
    exec(`npm install --save ${ addonName }`, (err, stdout, stderr) => {
      if (err || stderr.length > 0) {
        return this.fail(err || stderr);
      }
    });
  },

  fail(msg) {
    ui.error(msg);
    process.exit(1);
  }

});

