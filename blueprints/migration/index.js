import Blueprint from '../../lib/cli/blueprint';

export default class MigrationBlueprint extends Blueprint {

  static blueprintName = 'migration';
  static description = 'Generates a migration';

  params = [ 'name' ];

  locals({ name }) {
    return {
      name
    };
  }

}
