import {
  upperFirst,
  camelCase,
  lowerCase,
  kebabCase
} from 'lodash';
import { singularize, pluralize } from 'inflection';
import Blueprint from '../../lib/cli/blueprint';
import { CommandOptions } from '../../lib/cli/command';

export default class ResourceBlueprint extends Blueprint {

  static blueprintName = 'resource';
  static description = 'Generates a model, serializer, CRUD actions, and tests for a resource';

  params = [ 'name' ];

  locals(options: CommandOptions) {
    let name = options.params.name;
    if (Array.isArray(name)) {
      name = name[0];
    }
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

  async postInstall(options: CommandOptions) {
    let name = options.params.name;
    if (Array.isArray(name)) {
      name = name[0];
    }
    this.addRoute('resource', singularize(name));
  }

  async postUninstall(options: CommandOptions) {
    let name = options.params.name;
    if (Array.isArray(name)) {
      name = name[0];
    }
    this.removeRoute('resource', singularize(name));
  }

}
