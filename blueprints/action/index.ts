import {
  upperFirst,
  camelCase,
} from 'lodash';
import Blueprint from '../../lib/cli/blueprint';
import { CommandOptions } from '../../lib/cli/command';

export default class ActionBlueprint extends Blueprint {

  static blueprintName = 'action';
  static description = "Generates an action and it's unit & integration tests";

  params = [ 'name' ];

  flags = {
    method: {
      description: 'The HTTP method to use for the route to this action',
      default: 'post',
      type: String
    }
  };

  locals(options: CommandOptions): any {
    let name = options.params.name;
    if (Array.isArray(name)) {
      name = name[0];
    }
    let levels = name.split('/').map(() => '..');
    levels.pop();
    let nesting: string;
    if (levels.length > 0) {
      nesting = levels.join('/');
    } else {
      nesting = '.';
    }
    return {
      name,
      className: upperFirst(camelCase(name)),
      nesting
    };
  }

  async postInstall(options: CommandOptions): Promise<void> {
    let name = options.params.name;
    if (Array.isArray(name)) {
      name = name[0];
    }
    let method = options.flags.method || 'post';
    this.addRoute(method.toLowerCase(), `/${ name }`, name);
  }

  async postUninstall(options: CommandOptions): Promise<void> {
    let name = options.params.name;
    if (Array.isArray(name)) {
      name = name[0];
    }
    let method = options.flags.method || 'post';
    this.removeRoute(method.toLowerCase(), `/${ name }`, name);
  }
}
