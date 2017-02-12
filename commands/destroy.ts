import {
  merge
} from 'lodash';
import { ui, Command, Project, Blueprint } from 'denali-cli';
import unwrap from '../lib/utils/unwrap';

export default class DestroyCommand extends Command {

  static commandName = 'destroy';
  static description = 'Remove scaffolded code from your app';
  static longDescription = unwrap`
    Removes the code generated during a \`denali generate\` command. Errs on the
    side of caution when deleting code - it will only remove files that exactly
    match the generated output. Modified files will be left untouched. `;

  static params = '<blueprint>';

  static configureSubcommands(yargs: any, context: { name: string, isLocal: boolean }) {
    Blueprint.findBlueprints(yargs, merge({ action: 'destroy' }, context));
  }

}
