import assert from 'assert';
import util from 'util';
import capitalize from 'lodash/string/capitalize';
import camelCase from 'lodash/string/camelCase';
import keys from 'lodash/keys';

/**
 * The Container houses all the various classes that makeup a Denali app's
 * runtime. It holds references to the modules themselves, as well as caching
 * singleton instances and handling factory methods.
 *
 * @class container
 * @constructor
 */

export default class Container {

  constructor(config, logger) {
    this._registry = {};
    this._singletonCache = {};
    this.config = config;
    this.logger = logger;
  }

  /**
   * Register a value under the given `fullName` for later use.
   *
   * @method register
   * @param name {String} name to register under, i.e. 'application' or 'adapter:foo'
   * @param value {any} value to register
   */
  register(name, value) {
    let parsedName = this.parseName(name);
    this._registry[parsedName.fullName] = value;
  }

  /**
   * Lookup a value in the container.
   *
   * @method lookup
   * @param name {String} the name of the value to lookup, i.e. 'application' or 'adapter:foo'
   * @return {any}
   */
  lookup(name) {
    let parsedName = this.parseName(name);
    let lookupMethod = this['lookup' + capitalize(parsedName.type)] || this._lookupOther;
    return lookupMethod.call(this, parsedName);
  }

  lookupAll(type) {
    let matching = keys(this._registry).filter((fullName) => {
      return this.parseName(fullName).type === type;
    });
    return matching.map((fullName) => {
      this.lookup(fullName);
    });
  }

  /**
   * Lookup a value whose type doesn't have a unique lookup method.
   *
   * @method _lookupOther
   * @param parsedName {Object}
   * @return {any}
   * @private
   */
  _lookupOther(parsedName) {
    let fullName = parsedName.fullName;
    if (!this._registry[fullName]) {
      return null;
    }
    let value = this._registry[fullName];
    assert(!(value.singleton && value.instantiate), `You cannot set the 'singleton' as well as 'instantiate' container flag - they are mutually exclusive (${ fullName })`);
    if (value.singleton) {
      return this._instantiateSingleton(parsedName, value);
    }
    if (value.instantiate) {
      return this._instantiate(parsedName, value);
    }
    return value;
  }

  /**
   * Create a singleton instance if one does not exist, and return the singleton
   *
   * @method _instantiateSingleton
   * @param fullName {String}
   * @param value {any} singleton class
   * @return {Object} the singleton instance for the given class
   * @private
   */
  _instantiateSingleton(parsedName, value) {
    if (!this._singletonCache[parsedName.fullName]) {
      assert(typeof value === 'function', `Only functions can have the 'singleton' flag; you provided ${ util.inspect(value) }.`);
      this._singletonCache[parsedName.fullName] = this._instantiate(parsedName, value);
    }
    return this._singletonCache[parsedName.fullName];
  }

  /**
   * Given a parsedName and a class, instantiate the class
   *
   * @method _instantiate
   * @param parsedName {Object}
   * @param Class {Class} the class to instantiate
   * @return {Object} the instance of the supplied class
   * @private
   */
  _instantiate(parsedName, Class) {
    assert(typeof Class === 'function', `Only functions can have the 'instantiate' flag; you provided ${ Class }.`);
    return new Class({
      container: this,
      __meta: { parsedName }
    });
  }

  /**
   * Take the supplied name which can come in several forms, and normalize it.
   *
   * @method parseName
   * @param name {String}
   * @return {Object} the normalized name object
   * @private
   */
  parseName(name) {
    let [ type, modulePath ] = name.split(':');
    return {
      name,
      type,
      modulePath,
      moduleName: camelCase(modulePath),
    };
  }

}


// LEFT OFF - trying to simplify the container / factory mess.
//
// A few strategies:
//figure out logging
// 6. Standardize / simplify filter definition and specification. Are filters &
//    actions isomorphic?
// 7. Does nested action handling make sense at all?
//
