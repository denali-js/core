/**
 * @module denali
 * @submodule runtime
 */
const DenaliObject = require('./object');

const Initializer = DenaliObject.extend({

  initialize() {
    throw new Error('You must override the `initialize()` method and supply your own initializer function.');
  }

});

Initializer.singleton = true;

module.exports = Initializer;
