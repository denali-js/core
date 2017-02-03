import findKey from 'lodash/findKey';
import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';
import keys from 'lodash/keys';
import merge from 'lodash/merge';
import DenaliObject from '../metal/object';

/**
 * The Container houses all the various classes that makeup a Denali app's
 * runtime. It holds references to the modules themselves, as well as managing
 * lookup logic (i.e. some types of classes fall back to a generic "application"
 * class if a more specific one is not found.
 *
 * @class Container
 * @constructor
 * @module denali
 * @submodule runtime
 */

export default class Container extends DenaliObject {

  _cache = {};

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
  get config() {
    return this.lookup('config:environment');
  }

  /**
   * A reference to the application logger
   *
   * @property logger
   * @type {Logger}
   * @private
   */
  get logger() {
    return this.lookup('logger:main');
  }

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

  _lookupOther(parsedName, options = {}) {
    // Cache all this containerization / singleton instantiation, etc
    if (!this._cache[parsedName.fullName]) {
      let Class = this._registry[parsedName.fullName];

      // If lookup succeeded, handle any first-time lookup chores
      if (Class) {
        if (options.containerize) {
          Class = this._containerizeClass(Class);
        }
        if (Class.singleton) {
          Class = new Class();
        }

      // If the lookup failed, allow for a fallback
      } else if (options.fallback) {
        let fallback = result(options.fallback);
        let fallbackOptions = merge(options, {
          fallback: null,
          original: parsedName
        });
        Class = this._lookupOther(this.parseName(fallback), fallbackOptions);

      // If the lookup and fallback failed, bail
      } else {
        let message = `No such ${ parsedName.type } found: '${ parsedName.moduleName }'`;
        if (options.original) {
          message += `. Fallback lookup '${ options.original.fullName }' was also not found.`;
        }
        throw new Error(message);
      }

      // Update the cache with either the successful lookup, or the fallback
      this._cache[parsedName.fullName] = Class;
    }
    return this._cache[parsedName.fullName];
  }

  lookupModel(parsedName) {
    return this._lookupOther(parsedName, {
      containerize: true
    });
  }

  lookupService(parsedName) {
    return this._lookupOther(parsedName, {
      containerize: true
    });
  }

  lookupOrmAdapter(parsedName) {
    return this._lookupOther(parsedName, {
      containerize: true,
      fallback: () => {
        if (!this.config.ormAdapter) {
          throw new Error('No default ORM adapter was defined in supplied in config.ormAdapter!');
        }
        return `orm-adapter:${ this.config.ormAdapter }`;
      }
    });
  }

  lookupSerializer(parsedName) {
    return this._lookupOther(parsedName, {
      containerize: true,
      fallback: 'serializer:application'
    });
  }

  _containerizeClass(Class) {
    let container = this; // eslint-disable-line consistent-this
    class ContaineredClass extends Class {
      static container = container;
      container = container;
    }
    Object.defineProperty(ContaineredClass, 'name', {
      value: Class.name,
      writeable: false,
      configurable: true
    });
    return ContaineredClass;
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
      moduleName: camelCase(modulePath)
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
      return key.split(':')[0] === type;
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


function result(value) {
  if (typeof value === 'function') {
    return value();
  }
  return value;
}
