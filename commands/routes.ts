import dedent from 'dedent-js';
import CliTable from 'cli-table2';
import ui from '../lib/cli/ui';
import Command, { CommandOptions } from '../lib/cli/command';
import Project from '../lib/cli/project';

export default class RoutesCommand extends Command {

  static commandName = 'routes';
  static description = 'Display all defined routes within your application.';
  static longDescription = dedent`
    Displays routes from your application and any routes added by addons.
    Display shows the method, endpoint, and the action associated to that
    route.`;

  runsInApp = true;

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

  async run(options: CommandOptions) {
    let project = new Project({
      environment: options.flags.environment,
      printSlowTrees: options.flags['print-slow-trees'],
      buildDummy: true
    });
    let application = await project.createApplication();
    await application.runInitializers();
    let routes = application.router.routes;
    let methods = Object.keys(routes);
    let table = new CliTable({
      head: [ 'URL', 'ACTION' ]
    });

    methods.forEach((method) => {
      let methodRoutes = routes[method];

      methodRoutes.forEach((route) => {
        table.push([ `${ method.toUpperCase() } ${ route.spec.replace(/\(\/\)$/, '/') }`, route.actionPath ]);
      });
    });

    ui.info(table.toString());
  }

}
