import {
  upperFirst,
  camelCase
} from 'lodash';
import { Blueprint } from 'denali-cli';
import unwrap from '../../lib/utils/unwrap';

export default class ModelBlueprint extends Blueprint {

  static blueprintName = 'model';
  static description = 'Generates a blank model';
  static longDescription = unwrap`
    Usage: denali generate model <name> [options]

    Generates a blank model, along with a serializer for that model, and unit tests for both.

    Guides: http://denali.js.org/master/guides/data/models/
  `;

  static params = '<name>';

  locals(argv: any) {
    let name = argv.name;
    return {
      name,
      className: upperFirst(camelCase(name))
    };
  }

}
