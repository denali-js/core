import {
  upperFirst,
  camelCase
} from 'lodash';
import { Blueprint } from 'denali-cli';

export default class ModelBlueprint extends Blueprint {

  static blueprintName = 'model';
  static description = 'Generates a blank model';

  static params = '<name>';

  locals(argv: any) {
    let name = argv.name;
    return {
      name,
      className: upperFirst(camelCase(name))
    };
  }

}
