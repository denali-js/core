/**
 * @module denali
 * @submodule runtime
 */
import capitalize from 'lodash/capitalize';
import camelCase from 'lodash/camelCase';
import keys from 'lodash/keys';

/**
 * The Container houses all the various classes that makeup a Denali app's
 * runtime. It holds references to the modules themselves, as well as caching
 * singleton instances and handling factory methods.
 *
 * @class Container
 * @constructor
 */

export default class Container {

  _registry = {};
  _singletonCache = {};
  config;
  logger;

  constructor(config, logger) {
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
    let lookupMethod = this[`lookup${ capitalize(parsedName.type) }`] || this._lookupOther;
    return lookupMethod.call(this, parsedName);
  }

  lookupAll(type) {
    let matching = keys(this._registry).filter((fullName) => {
      return this.parseName(fullName).type === type;
    });
    return matching.map((fullName) => this.lookup(fullName));
  }

  lookupSerializer(...args) {
    return this.lookupWithApplicationFallback(...args);
  }

  lookupWithApplicationFallback(parsedName) {
    let result = this._lookupOther(parsedName);
    if (!result) {
      let fallback = this.parseName(parsedName.fullName.replace(/:.+/, ':application'));
      result = this._lookupOther(fallback);
    }
    return result;
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
    return this._registry[fullName];
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
      fullName: name,
      type,
      modulePath,
      moduleName: camelCase(modulePath),
    };
  }

}
