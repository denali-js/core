import {
  lowerCase
} from 'lodash';
import { Blueprint } from 'denali-cli';
import unwrap from '../../lib/utils/unwrap';

/**
 * Generates a model, serializer, CRUD actions, and tests for a resource
 */
export default class ResourceBlueprint extends Blueprint {

  /* tslint:disable:completed-docs typedef */
  public static blueprintName = 'acceptance-test';
  public static description = 'Generates a blank acceptance test';
  public static longDescription = unwrap`
    Usage: denali generate acceptance-test <name>

    Generates a blank acceptance test, suitable for testing your app end-to-end with simulated HTTP
    requests and responses.
  `;

  public static params = '<name>';

  public locals(argv: any) {
    let name = argv.name;
    return { name, humanizedName: lowerCase(name) };
  }

}
