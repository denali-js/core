import unwrap from '../lib/utils/unwrap';
import GenerateCommand from './generate';
import { Blueprint } from 'denali-cli';

export default class NewCommand extends GenerateCommand {

  static commandName = 'new';
  static description = 'Create a new denali app';
  static longDescription = unwrap`
    Scaffolds a new Denali application in a child directory using the given name.
    Takes care of setting up a git repo and installing npm dependencies as well.`;

  static params = '<name>';

}
