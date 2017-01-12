import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';
import Blueprint from '../../lib/cli/blueprint';

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

  locals({ name }) {
    let levels = name.split('/').map(() => '..');
    levels.pop();
    if (levels.length > 0) {
      levels = levels.join('/');
    } else {
      levels = '.';
    }
    return {
      name,
      className: upperFirst(camelCase(name)),
      nesting: levels
    };
  }

  postInstall({ name }, { method = 'post' }) {
    this.addRoute(method.toLowerCase(), `/${ name }`, name);
  }

  postUninstall({ name }, { method = 'post' }) {
    this.removeRoute(method.toLowerCase(), `/${ name }`, name);
  }
}
