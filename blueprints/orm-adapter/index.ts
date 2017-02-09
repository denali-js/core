import Blueprint from '../../lib/cli/blueprint';
import { singularize } from 'inflection';
import {
  upperFirst,
  camelCase
} from 'lodash';
import { CommandOptions } from '../../lib/cli/command';

export default class ORMAdapterBlueprint extends Blueprint {

  static blueprintName = 'orm-adapter';
  static description = 'Generates a blank ORM adapter with stubs for all the required methods';

  params = [ 'name' ];

  locals(options: CommandOptions) {
    let name = options.params.name;
    if (Array.isArray(name)) {
      name = name[0];
    }
    name = singularize(name);
    return {
      name,
      className: upperFirst(camelCase(name))
    };
  }

}
