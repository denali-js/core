import mixin from './mixin';

export default class DenaliObject {

  static mixin(...mixins) {
    return mixin(this, ...mixins);
  }

}
