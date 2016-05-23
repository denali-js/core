import path from 'path';
import repl from 'repl';
import chalk from 'chalk';
import ui from '../lib/ui';
import Command from '../lib/command';
import BuildCommand from './build';
import Application from '../../runtime/application';
import tryRequire from '../../utils/try-require';

export default class ConsoleCommand extends Command {

  static commandName = 'console';
  static description = 'Launch a REPL with your application loaded';
  static longDescription = `
Starts a REPL (Read-Eval-Print Loop) with your application initialized and
loaded into memory. Type \`.help\` in the REPL environment for more details.
  `;

  params = [];

  flags = {};

  runsInApp = true;

  run() {
    return BuildCommand.prototype.build.call(this).then(() => {
      let suppliedEnv = process.env.DENALI_ENV || process.env.NODE_ENV;
      if (suppliedEnv === 'production') {
        ui.warn('WARNING: Your console is running in production mode, meaning your production configuration is being used');
        ui.warn('         This means your app is likely connecting to live, production database. Use caution!');
      }

      process.env.DENALI_ENV = suppliedEnv || 'development';
      ui.info(`Loading ${ process.env.DENALI_ENV } environment. Type '.help' for details`);

      // TODO this command shouldn't need to be aware of /dist
      const UserApplication = tryRequire(path.join(process.cwd(), 'dist/app/application.js'));
      if (!UserApplication) {
        ui.error(`Unable to load your application - expected /app/application.js to export a subclass of Application, but found ${ UserApplication } instead.`);
        process.exit(1);
      }

      let application = new UserApplication({
        environment: process.env.DENALI_ENV || process.env.NODE_ENV || 'development',
        dir: path.join(process.cwd(), 'dist')
      });

      return application.runInitializers().then(() => {

        let consoleRepl = repl.start({
          prompt: 'denali> ',
          useGlobal: true
        });

        global.application = application;
        global.container = application.container;
        global.modelFor = function modelFor(type) { return container.lookup(`model:${ type }`); };

        consoleRepl.defineCommand('help', {
          action() {
            console.log(`
  Welcome to the Denali console!

  This is a fully interactive REPL for your Denali app. That means normal
  JavaScript works here. Your application is loaded (but not started) in the
  background, allowing you to inspect the runtime state of your app.

  The following variables are availabe:

  * ${ chalk.underline('application') } - an instance of your Application class
  * ${ chalk.underline('container') } - shortcut to application.container. Use this to
    lookup the various classes associated with your app (i.e. actions, models,
    etc)
            `.trim());
            this.displayPrompt();
          }
        });

      });
    });
  }

}

