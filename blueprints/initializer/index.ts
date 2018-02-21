import { Blueprint, unwrap } from '@denali-js/cli';

/**
 * Generates a blank initializer
 *
 * @package blueprints
 */
export default class InitializerBlueprint extends Blueprint {

  /* tslint:disable:completed-docs typedef */
  static blueprintName = 'initializer';
  static description = 'Generates a blank initializer';
  static longDescription = unwrap`
    Usage: denali generate initializer <name>

    Generates a blank service class.

    Guides: http://denalijs.org/master/guides/application/initializers/
  `;

  static params = '<name>';

  locals(argv: any) {
    let name = argv.name;
    return { name };
  }

}
