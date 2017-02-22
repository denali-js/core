import {
  upperFirst,
  camelCase,
  lowerCase,
  kebabCase
} from 'lodash';
import { singularize, pluralize } from 'inflection';
import { Blueprint } from 'denali-cli';
import unwrap from '../../lib/utils/unwrap';

/**
 * Generates a model, serializer, CRUD actions, and tests for a resource
 *
 * @package blueprints
 */
export default class ResourceBlueprint extends Blueprint {

  /* tslint:disable:completed-docs typedef */
  public static blueprintName = 'resource';
  public static description = 'Generates a model, serializer, CRUD actions, and tests for a resource';
  public static longDescription = unwrap`
    Usage: denali generate resource <name> [options]

    Generates a complete, end-to-end RESTful resource scaffold. This includes a Model to represent
    the data, a Serializer to determine how to send it over the wire, CRUD actions for manipulating
    the resource, and tests for all of the above.
  `;

  public static params = '<name>';

  public locals(argv: any) {
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

  public async postInstall(argv: any) {
    this.addRoute('resource', singularize(argv.name));
  }

  public async postUninstall(argv: any) {
    this.removeRoute('resource', singularize(argv.name));
  }

}
