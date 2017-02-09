import {
  upperFirst,
  camelCase
} from 'lodash';
import { Blueprint } from 'denali-cli';

export default class SerializerBlueprint extends Blueprint {

  static blueprintName = 'serializer';
  static description = 'Generates a blank serializer';

  static params = '<name>';

  locals(argv: any) {
    let name = argv.name;
    return {
      name,
      className: upperFirst(camelCase(name))
    };
  }
}
