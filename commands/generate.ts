import {
  merge
} from 'lodash';
import { ui, Command, Project, Blueprint } from 'denali-cli';
import unwrap from '../lib/utils/unwrap';

export default class GenerateCommand extends Command {

  static commandName = 'generate';
  static description = 'Scaffold code for your app.';
  static longDescription = unwrap`
    Usage: denali generate <blueprint> [options]

    Generates code from the given blueprint. Blueprints are templates used by the
    generate command, but they can go beyond simple templating (i.e. installing
    addons).
  `;

  static params = '<blueprint>';

  static configureSubcommands(yargs: any, context: { name: string, isLocal: boolean }) {
    Blueprint.findBlueprints(yargs, merge({ action: 'generate' }, context));
  }

}
