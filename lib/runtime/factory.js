import DenaliObject from './object';

const factoryFlag = Symbol.for('denali:factory');

const Factory = DenaliObject.extend({

  singleton: null,
  instantiate: null,

  build() {
    throw new Error('You must implement the `build()` method for your factory.');
  }

});

Factory[factoryFlag] = true;

export default Factory;
