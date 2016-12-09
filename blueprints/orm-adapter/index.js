import Blueprint from '../../lib/cli/blueprint';
import { singularize } from 'inflection';
import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';

export default class ORMAdapterBlueprint extends Blueprint {

  static blueprintName = 'orm-adapter';
  static description = 'Generates a blank ORM adapter with stubs for all the required methods';

  params = [ 'name' ];

  locals({ name }) {
    name = singularize(name);
    return {
      name,
      className: upperFirst(camelCase(name))
    };
  }

}
