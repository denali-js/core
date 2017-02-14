import unwrap from '../lib/utils/unwrap';
import GenerateCommand from './generate';
import { Blueprint } from 'denali-cli';

/**
 * Create a new denali app
 */
export default class NewCommand extends GenerateCommand {

  /* tslint:disable:completed-docs typedef */
  public static commandName = 'new';
  public static description = 'Create a new denali app';
  public static longDescription = unwrap`
    Scaffolds a new Denali application in a child directory using the given name.
    Takes care of setting up a git repo and installing npm dependencies as well.`;

  public static params = '<name>';

}
