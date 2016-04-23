/**
 * @module denali
 * @submodule runtime
 */
const assert = require('assert');

/**
 * Tracks a property to be injected from the container. Replaced at inheritance
 * time with a getter property that returns the injected value.
 *
 * @class Injection
 * @constructor
 * @private
 */
class Injection {
  constructor(name) {
    this.injectedName = name;
    this.getter = function() {
      assert('You must provide a container instance to a class with injections.', this.container);
      return this.container.lookup(name);
    };
  }

  setter() {
    throw new Error('You cannot modify an injected value.');
  }
};

/**
 * Dependency injections provide a powerful way to wire up dependences across
 * your app. Rather that statically importing dependencies, you simply define
 * a property on any container-aware class using this `inject()` function, and
 * instances of that class will have access to the injected value.
 *
 * This is helpful for two main reasons:
 *
 *   * Controlling load order and initializiation. Many Node libraries require
 *     upfront initializiation, but Denali may not have loaded all the config
 *     necessary at that point. Injecting dependencies at runtime lets us ensure
 *     everything is loaded that must be.
 *
 *   * Testing becomes much easier since you can stub out any value in the
 *     container for the duration of the test.
 *
 * @method inject
 * @param name {String} the name of the resource in the container to inject;
 * typically follows the `type:module` pattern, i.e. `model:user`
 * @return {Injection} a placeholder Injection instance used to mark the
 * property as a container injection
 */
module.exports = function inject(name) {
  return new Injection(name);
};

module.exports.Injection = Injection;
