/**
 * @module denali
 * @submodule runtime
 */
import DenaliObject from './object';

const Initializer = DenaliObject.extend({

  initialize() {
    throw new Error('You must override the `initialize()` method and supply your own initializer function.');
  }

});

Initializer.singleton = true;

export default Initializer;
