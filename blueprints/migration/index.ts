import { Blueprint } from 'denali-cli';
import moment from 'moment';
import assert from 'assert';

export default class MigrationBlueprint extends Blueprint {

  static blueprintName = 'migration';
  static description = 'Generates a migration';

  static params = '<name>';

  locals(argv: any) {
    let name = argv.name;
    assert(name, 'You must provide a name for this migration');
    let filename = `${ moment().format('X') }-${ name }`;
    return { name, filename };
  }

}
