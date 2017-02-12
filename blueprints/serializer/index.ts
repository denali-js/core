import {
  upperFirst,
  camelCase
} from 'lodash';
import { Blueprint } from 'denali-cli';
import unwrap from '../../lib/utils/unwrap';

export default class SerializerBlueprint extends Blueprint {

  static blueprintName = 'serializer';
  static description = 'Generates a blank serializer';
  static longDescription = unwrap`
    Usage: denali generate serializer <name> [options]

    Generates a blank serializer for the given model.

    Guides: http://denali.js.org/master/guides/data/serializers/
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
