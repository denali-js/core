import { Blueprint } from 'denali-cli';
import unwrap from '../../lib/utils/unwrap';

export default class ServiceBlueprint extends Blueprint {

  static blueprintName = 'service';
  static description = 'Generates a blank service';
  static longDescription = unwrap`
    Usage: denali generate service <name> [options]

    Generates a blank service class.

    Guides: http://denali.js.org/master/guides/application/services/
  `;

  static params = '<name>';

}
