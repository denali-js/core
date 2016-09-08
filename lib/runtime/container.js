/**
 * @module denali
 * @submodule runtime
 */
import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';
import keys from 'lodash/keys';

/**
 * The Container houses all the various classes that makeup a Denali app's
 * runtime. It holds references to the modules themselves, as well as managing
 * lookup logic (i.e. some types of classes fall back to a generic "application"
 * class if a more specific one is not found.
 *
 * @class Container
 * @constructor
 */

export default class Container {
  /**
   * The internal cache of available references
   *
   * @property _registry
   * @type {Object}
   * @private
   */
  _registry = {};

  /**
   * A reference to the application config
   *
   * @property config
   * @type {Object}
   * @private
   */
  get config() { return this.lookup('config:environment'); }

  /**
   * A reference to the application logger
   *
   * @property logger
   * @type {Logger}
   * @private
   */
  get logger() { return this.lookup('logger:main'); }

  /**
   * Register a value under the given `fullName` for later use.
   *
   * @method register
   * @param name {String} name to register under, i.e. 'application' or
   * 'model:foo'
   * @param value {any} value to register
   */
  register(name, value) {
    let parsedName = this.parseName(name);
    this._registry[parsedName.fullName] = value;
  }

  /**
   * Lookup a value in the container. Uses type specific lookup logic if
   * available.
   *
   * @method lookup
   * @param name {String} the name of the value to lookup, i.e. 'application'
   * or 'adapter:foo'
   * @return {any}
   */
  lookup(name) {
    let parsedName = this.parseName(name);
    let lookupMethod = this[`lookup${ upperFirst(camelCase(parsedName.type)) }`] || this._lookupOther;
    return lookupMethod.call(this, parsedName);
  }

  /**
   * Lookup all modules of a specific type in the container. Returns an object
   * of all the modules keyed by their module path (i.e.
   * `role:employees/manager` would be found under
   * `lookupAll('role')['employees/manager']`
   *
   * @method lookup
   * @param name {String} the name of the value to lookup, i.e. 'application'
   * or 'adapter:foo'
   * @return {any}
   */
  lookupAll(type) {
    return keys(this._registry).filter((fullName) => {
      return this.parseName(fullName).type === type;
    }).reduce((typeMap, fullName) => {
      typeMap[this.parseName(fullName).modulePath] = this.lookup(fullName);
      return typeMap;
    }, {});
  }

  /**
   * Lookup a model class. This special case is needed because Models need a
   * reference to the container, but their lifecycle isn't always controlled
   * by the framework (which would allow us to the inject the container per
   * instance). Thus, we make sure the class has a reference, which the
   * instances leverage via `this.constructor.container`.
   *
   * @method lookupModel
   * @param parsedName {Object}
   * @return Model
   */
  lookupModel(parsedName) {
    let Model = this._lookupOther(parsedName);
    if (!Model) {
      throw new Error(`No such model found: ${ parsedName.moduleName }`);
    }
    Model.container = this;
    return Model;
  }

  lookupOrmAdapter(parsedName) {
    let ORMAdapter = this._lookupOther(parsedName);
    if (!ORMAdapter) {
      if (!this.config.ormAdapter) {
        throw new Error('No default ORM adapter was defined in supplied in config.ormAdapter!');
      }
      ORMAdapter = this._lookupOther(this.parseName(`orm-adapter:${ this.config.ormAdapter }`));
    }
    return ORMAdapter;
  }

  lookupSerializer(...args) {
    let Serializer = this.lookupWithApplicationFallback(...args);
    if (!Serializer) {
      throw new Error('No application serializer defined! You must define at least an ApplicationSerializer to use as the default.');
    }
    Serializer.container = this;
    return Serializer;
  }

  /**
   * Lookup a type specific class, and if that's not available, fall back to the
   * generic "application" class
   *
   * @method lookupWithApplicationFallback
   * @param parsedName {Object}
   * @return {any}
   * @private
   */
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
    if (modulePath === undefined || modulePath === 'undefined') {
      throw new Error(`You tried to look up a ${ type } called undefined - did you pass in a variable that doesn't have the expected value?`);
    }
    return {
      fullName: name,
      type,
      modulePath,
      moduleName: camelCase(modulePath),
    };
  }

  /**
   * For a given type, returns the names of all the available modules under that
   * type. Primarily used for debugging purposes (i.e. to show available modules
   * when a lookup of that type fails).
   *
   * @method availableForType
   * @param type {String}
   * @return {Array} an array of module names
   * @private
   */
  availableForType(type) {
    return Object.keys(this._registry).filter((key) => {
      return key.startsWith(type);
    }).map((key) => {
      return key.split(':')[1];
    });
  }

  /**
   * Find the module name for the given module object. Essentially the reverse
   * of `.lookup()`
   *
   * @method moduleNameFor
   * @param mod {Object}
   * @return {String}
   */
  moduleNameFor(mod) {
    return findKey(this._registry, (value) => value === mod);
  }
}
