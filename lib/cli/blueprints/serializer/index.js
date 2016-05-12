import Blueprint from '../../lib/blueprint';

export default class SerializerBlueprint extends Blueprint {

  static blueprintName = 'serializer';
  static description = "Generates a blank serializer";

  params = [ 'name' ];

}
