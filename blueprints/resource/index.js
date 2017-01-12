import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';
import lowerCase from 'lodash/lowerCase';
import kebabCase from 'lodash/kebabCase';
import { singularize, pluralize } from 'inflection';
import Blueprint from '../../lib/cli/blueprint';

export default class ResourceBlueprint extends Blueprint {

  static blueprintName = 'resource';
  static description = 'Generates a model, serializer, CRUD actions, and tests for a resource';

  params = [ 'name' ];

  locals({ name }) {
    name = pluralize(name);
    let plural = {
      name,
      camelCased: camelCase(name),
      className: upperFirst(camelCase(name)),
      dasherized: kebabCase(name),
      humanized: lowerCase(name)
    };
    name = singularize(name);
    let singular = {
      name,
      camelCased: camelCase(name),
      className: upperFirst(camelCase(name)),
      dasherized: kebabCase(name),
      humanized: lowerCase(name)
    };
    return { plural, singular };
  }

}
