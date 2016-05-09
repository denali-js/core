import capitalize from 'lodash/capitalize';
import Blueprint from '../../lib/blueprint';

export default class ActionBlueprint extends Blueprint {
  locals(args) {
    return {
      name: args[0],
      className: capitalize(args[0]) + 'Action'
    };
  }
}
