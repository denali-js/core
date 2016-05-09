import repl from 'repl';
import ui from '../lib/ui';
import Command from '../lib/command';
import Application from '../../runtime/application';
import tryRequire from '../../utils/try-require';

export default class ConsoleCommand extends Command {

  description = 'Launch a Node REPL with your application loaded';

  params = [];

  flags = {};

  runsInApp = true;

  run() {
    let suppliedEnv = process.env.DENALI_ENV || process.env.NODE_ENV;
    if (suppliedEnv === 'production') {
      ui.warn('WARNING: Your console is running in production mode, meaning your production configuration is being used');
      ui.warn('         This means your app is likely connecting to live, production database. Use caution!');
    }

    process.env.DENALI_ENV = suppliedEnv || 'development';
    ui.info(`Loading ${ process.env.DENALI_ENV } environment. Type '.help' for details`);

    const application = tryRequire('./index.js');
    if (!application || !(application instanceof Application)) {
      ui.error('Unable to load your application - does your index.js file export the application instance?');
      process.exit(1);
    }

    let consoleRepl = repl.start({
      prompt: 'denali> '
    });

    consoleRepl.context = {
      application,
      container: application.container
    };

    consoleRepl.defineCommand('help', {
      action() {
        this.write(`
          This is the Denali console, an interactive REPL for your Denali app.
          This is a full JavaScript REPL, so normal JavaScript works here. Your
          application is loaded and running in the background - you can access
          it via the \`application\` variable. The \`container\` variable is
          also available, to lookup any of your app's classes.
        `);
        this.displayPrompt();
      }
    });
  }

}

