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

  protected static configureSubcommands(yargs: any, context: { name: string, isLocal: boolean }) {
    Blueprint.findBlueprints(yargs, merge({ action: 'destroy' }, context));
  }

}
