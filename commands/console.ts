import repl from 'repl';
import dedent from 'dedent-js';
import chalk from 'chalk';
import ui from '../lib/cli/ui';
import Command, { CommandOptions } from '../lib/cli/command';
import Project from '../lib/cli/project';
import {
  assign
} from 'lodash';

export default class ConsoleCommand extends Command {

  static commandName = 'console';
  static description = 'Launch a REPL with your application loaded';
  static longDescription = dedent`
    Starts a REPL (Read-Eval-Print Loop) with your application initialized and
    loaded into memory. Type \`.help\` in the REPL environment for more details.`;

  params: string[] = [];

  flags = {
    environment: {
      description: 'The target environment to build for.',
      defaultValue: 'development',
      type: String
    },
    'print-slow-trees': {
      description: 'Print out an analysis of the build process, showing the slowest nodes.',
      defaultValue: false,
      type: Boolean
    }
  };

  runsInApp = true;

  async run(options: CommandOptions) {
    ui.info(`Loading ${ options.flags.environment } environment. Type '.help' for details`);
    let project = new Project({
      environment: options.flags.environment,
      printSlowTrees: options.flags['print-slow-trees'],
      buildDummy: true
    });
    let application = await project.createApplication();
    if (application.environment === 'production') {
      ui.warn('WARNING: Your console is running in production environment, meaning your production configuration is being used');
      ui.warn('         This means your app is likely connecting to live, production database. Use caution!');
    }

    await application.runInitializers();

    let consoleRepl = repl.start({
      prompt: 'denali> ',
      useGlobal: true
    });

    let context = {
      application: application,
      container: application.container,
      modelFor(type: string) {
        return application.container.lookup(`model:${ type }`);
      }
    };
    assign(global, context);

    consoleRepl.defineCommand('help', {
      help: '',
      action() {
        // eslint-disable-next-line no-console
        console.log(dedent`
          Welcome to the Denali console!

          This is a fully interactive REPL for your Denali app. That means normal
          JavaScript works here. Your application is loaded (but not started) in the
          background, allowing you to inspect the runtime state of your app.

          The following variables are availabe:

          * ${ chalk.underline('application') } - an instance of your Application class
          * ${ chalk.underline('container') } - shortcut to application.container. Use this to
            lookup the various classes associated with your app (i.e. actions, models,
            etc)
        `);
        this.displayPrompt();
      }
    });
  }

}
