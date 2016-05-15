import capitalize from 'lodash/capitalize';
import Blueprint from '../../lib/blueprint';

export default class ActionBlueprint extends Blueprint {

  static blueprintName = 'action';
  static description = "Generates an action and it's unit & integration tests";

  params = [ 'name' ];

  locals({ params }) {
    return {
      name: params.name,
      className: `${ capitalize(params.name) } Action`
    };
  }
}
