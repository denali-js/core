import Blueprint from '../../lib/blueprint';
import { singularize, pluralize } from 'inflection';

export default class ResourceBlueprint extends Blueprint {

  static blueprintName = 'resource';
  static description = "Generates a model, serializer, CRUD actions, and tests for a resoure";

  params = [ 'name' ];

  locals({ name }) {
    return {
      name: singularize(name),
      pluralName: pluralize(name)
    };
  }
}
