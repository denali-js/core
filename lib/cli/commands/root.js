import ui from '../lib/ui';
import Command from '../lib/command';

export default class RootCommand extends Command {

  flags = {
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
  };

  run(params, flags) {
    if (flags.version) {
      this.printVersion();
    } else {
      this.printHelp();
    }
  }

  printVersion() {
    let pkg = require('./package.json');
    ui.info(`denali: ${ pkg.dependencies.denali }`);
    ui.info(`node: ${ process.version }`);
  }

  printHelp() {

  }

}

