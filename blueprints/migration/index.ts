import { Blueprint } from 'denali-cli';
import moment from 'moment';
import assert from 'assert';
import unwrap from '../../lib/utils/unwrap';

export default class MigrationBlueprint extends Blueprint {

  static blueprintName = 'migration';
  static description = 'Generates a migration';
  static longDescription = unwrap`
    Usage: denali generate migration <name> [options]

    Generates a new blank migration. The filename will include the current Unix timestamp to ensure
    proper sorting and execution order when running migrations.

    Guides: http://denali.js.org/master/guides/data/migrations/
  `;

  static params = '<name>';

  locals(argv: any) {
    let name = argv.name;
    assert(name, 'You must provide a name for this migration');
    let filename = `${ moment().format('X') }-${ name }`;
    return { name, filename };
  }

}
