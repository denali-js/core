import Blueprint from '../../lib/cli/blueprint';
import moment from 'moment';
import assert from 'assert';
import { CommandOptions } from '../../lib/cli/command';

export default class MigrationBlueprint extends Blueprint {

  static blueprintName = 'migration';
  static description = 'Generates a migration';

  params = [ 'name' ];

  locals(options: CommandOptions) {
    let name = options.params.name;
    if (Array.isArray(name)) {
      name = name[0];
    }
    assert(name, 'You must provide a name for this migration');
    let filename = `${ moment().format('X') }-${ name }`;
    return { name, filename };
  }

}
