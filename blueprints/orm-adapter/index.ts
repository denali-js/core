import { Blueprint } from 'denali-cli';
import { singularize } from 'inflection';
import {
  upperFirst,
  camelCase
} from 'lodash';

export default class ORMAdapterBlueprint extends Blueprint {

  static blueprintName = 'orm-adapter';
  static description = 'Generates a blank ORM adapter with stubs for all the required methods';

  static params = '<name>';

  locals(argv: any) {
    let name = argv.name;
    name = singularize(name);
    return {
      name,
      className: upperFirst(camelCase(name))
    };
  }

}
