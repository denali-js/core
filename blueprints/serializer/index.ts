import {
  upperFirst,
  camelCase
} from 'lodash';
import Blueprint from '../../lib/cli/blueprint';
import { CommandOptions } from '../../lib/cli/command';

export default class SerializerBlueprint extends Blueprint {

  static blueprintName = 'serializer';
  static description = 'Generates a blank serializer';

  params = [ 'name' ];

  locals(options: CommandOptions) {
    let name = options.params.name;
    if (Array.isArray(name)) {
      name = name[0];
    }
    return {
      name,
      className: upperFirst(camelCase(name))
    };
  }
}
