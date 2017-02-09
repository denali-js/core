import { Blueprint } from 'denali-cli';

export default class ServiceBlueprint extends Blueprint {

  static blueprintName = 'service';
  static description = 'Generates a blank service';

  static params = '<name>';

}
