import {
  merge
} from 'lodash';
import { ui, Command, Project, Blueprint } from 'denali-cli';
import unwrap from '../lib/utils/unwrap';

/**
 * Scaffold code for your app.
 */
export default class GenerateCommand extends Command {

  /* tslint:disable:completed-docs typedef */
  public static commandName = 'generate';
  public static description = 'Scaffold code for your app.';
  public static longDescription = unwrap`
    Usage: denali generate <blueprint> [options]

    Generates code from the given blueprint. Blueprints are templates used by the
    generate command, but they can go beyond simple templating (i.e. installing
    addons).
  `;

  public static params = '<blueprint>';

  public static flags = {
    skipPostInstall: {
      description: "Don't run any post install hooks for the blueprint",
      default: false,
      type: <any>'boolean'
    }
  };

  protected static configureSubcommands(commandName: string, yargs: any, projectPkg: any) {
    return Blueprint.findAndConfigureBlueprints(yargs, 'generate', projectPkg);
  }

}
