import {
  assign
} from 'lodash';
import * as path from 'path';
import { Command, Blueprint } from 'denali-cli';
import AppBlueprint from '../blueprints/app/index';


/**
 * Create a new denali app
 *
 * @package commands
 */
export default class NewCommand extends Command {

  /* tslint:disable:completed-docs typedef */
  public static commandName = 'new';
  public static description = AppBlueprint.description;
  public static longDescription = AppBlueprint.longDescription;
  public static params = AppBlueprint.params;
  public static flags = AppBlueprint.flags;

  public static runsInApp = false;

  public async run(argv: any) {
    AppBlueprint.dir = path.join(__dirname, '..', 'blueprints', 'app');
    let appBlueprint = new AppBlueprint();
    await appBlueprint.generate(argv);
  }

}
