import {
  upperFirst,
  camelCase,
  lowerCase,
  kebabCase
} from 'lodash';
import { singularize, pluralize } from 'inflection';
import { Blueprint } from 'denali-cli';

export default class ResourceBlueprint extends Blueprint {

  static blueprintName = 'resource';
  static description = 'Generates a model, serializer, CRUD actions, and tests for a resource';

  static params = '<name>';

  locals(argv: any) {
    let name = argv.name;
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

  async postInstall(argv: any) {
    this.addRoute('resource', singularize(argv.name));
  }

  async postUninstall(argv: any) {
    this.removeRoute('resource', singularize(argv.name));
  }

}
