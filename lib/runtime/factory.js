import assert from 'assert';
import DenaliObject from './object';

export default DenaliObject.extend({

  init() {
    this._super(...arguments);
    assert(this.container, 'You must supply a container to Factories.');
    this.container.register(this.__meta.parsedName.fullName, this.build());
  },

  build() {
    throw new Error('You must implement the `build()` method for your factory.');
  }

});
