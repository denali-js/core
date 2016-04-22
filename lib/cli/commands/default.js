const Command = require('../lib/command');

module.exports = Command.extend({

  flags: {
    version: {
      description: `
        Print the version of Denali used in the current project, or the global
        version if invoked outside a project
      `,
      type: Boolean
    },
    help: {
      description: 'Show this help message',
      type: Boolean
    }
  },

  run(params, flags) {
    if (flags.version) {
      this.printVersion();
    } else {
      this.printHelp();
    }
  }

});

