import {
  merge
} from 'lodash';
import { ui, Command, Project, Blueprint } from 'denali-cli';
import unwrap from '../lib/utils/unwrap';

/**
 * Remove scaffolded code from your app
 */
export default class DestroyCommand extends Command {

  /* tslint:disable:completed-docs typedef */
  public static commandName = 'destroy';
  public static description = 'Remove scaffolded code from your app';
  public static longDescription = unwrap`
    Removes the code generated during a \`denali generate\` command. Errs on the
    side of caution when deleting code - it will only remove files that exactly
    match the generated output. Modified files will be left untouched. `;

  public static params = '<blueprint>';

  public static flags = {
    skipPostUninstall: {
      description: "Don't run any post uninstall hooks for the blueprint",
      default: false,
      type: <any>'boolean'
    }
  };

  protected static configureSubcommands(commandName: string, yargs: any, projectPkg: any) {
    return Blueprint.findAndConfigureBlueprints(yargs, 'destroy', projectPkg);
  }

}
