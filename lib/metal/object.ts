  import mixin, { MixinApplicator } from './mixin';

/**
 * The base object class for Denali classes. Adds mixin support.
 *
 * @export
 * @class DenaliObject
 */
export default class DenaliObject {

  static mixin(...mixins: MixinApplicator[]): Function {
    return mixin(this, ...mixins);
  }

}
