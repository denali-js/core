import {
  findKey,
  upperFirst,
  camelCase,
  keys,
  merge,
} from 'lodash';
import DenaliObject from '../metal/object';
import Logger from './logger';
import Model from '../data/model';
import Serializer from '../data/serializer';
import OrmAdapter from '../data/orm-adapter';
import Service from './service';

interface ParsedName {
  fullName: string;
  type: string;
  modulePath: string;
  moduleName: string;
}

interface FallbackGetter {
  (): string;
}

interface LookupOptions {
  containerize?: boolean;
  singleton?: boolean;
  fallback?: string | FallbackGetter;
  original?: ParsedName;
}

interface ModuleRegistry {
  [moduleName: string]: any;
}

type Constructor<T> = new(...args: any[]) => T;

/**
 * The Container houses all the various classes that makeup a Denali app's
 *
 * runtime. It holds references to the modules themselves, as well as managing
 * lookup logic (i.e. some types of classes fall back to a generic "application"
 * class if a more specific one is not found.
 *
 * @export
 * @class Container
 * @extends {DenaliObject}
 * @module denali
 * @submodule runtime
 */
export default class Container extends DenaliObject {

  /**
   * An internal cache of lookups and their resolved values
   *
   * @private
   * @type {ModuleRegistry}
   */
  private _cache: ModuleRegistry = {};

  /**
   * The internal cache of available references
   *
   * @private
   * @type {ModuleRegistry}
   */
  private _registry: ModuleRegistry = {};

  /**
   * A reference to the application config
   *
   * @readonly
   * @type {*}
   */
  public get config(): any {
    return this.lookup('config:environment');
  }

  /**
   * A reference to the application logger
   *
   * @readonly
   * @type {Logger}
   */
  public get logger(): Logger {
    return this.lookup('logger:main');
  }

  /**
   * Register a value under the given `fullName` for later use.
   *
   * @param {string} name
   * @param {*} value
   */
  public register(name: string, value: any): void {
    let parsedName = this.parseName(name);
    this._registry[parsedName.fullName] = value;
  }

  /**
   * Lookup a value in the container. Uses type specific lookup logic if
   * available.
   *
   * @param {string} name
   * @returns {*}
   */
  public lookup(name: string): any {
    let parsedName = this.parseName(name);
    let lookupMethod = this[`lookup${ upperFirst(camelCase(parsedName.type)) }`] || this._lookupOther;
    return lookupMethod.call(this, parsedName);
  }

  [key: string]: any;

  /**
   * Lookup all modules of a specific type in the container. Returns an object of all the modules
   * keyed by their module path (i.e. `role:employees/manager` would be found under
   * `lookupAll('role')['employees/manager']`
   *
   * @param {string} type
   * @returns {{ [moduleName: string]: any }}
   */
  lookupAll(type: string): { [moduleName: string]: any } {
    return keys(this._registry).filter((fullName) => {
      return this.parseName(fullName).type === type;
    }).reduce((typeMap: ModuleRegistry, fullName) => {
      typeMap[this.parseName(fullName).modulePath] = this.lookup(fullName);
      return typeMap;
    }, {});
  }

  /**
   * @private
   * @param {ParsedName} parsedName
   * @param {LookupOptions} [options={ containerize: false, singleton: false }]
   * @returns
   */
  private _lookupOther(parsedName: ParsedName, options: LookupOptions = { containerize: false, singleton: false }) {
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

  /**
   * @private
   * @param {ParsedName} parsedName
   * @returns {Model}
   */
  private lookupModel(parsedName: ParsedName): Model {
    return this._lookupOther(parsedName, {
      containerize: true
    });
  }

  /**
   * @private
   * @param {ParsedName} parsedName
   * @returns {Service}
   */
  private lookupService(parsedName: ParsedName): Service {
    return this._lookupOther(parsedName, {
      containerize: true,
      singleton: true
    });
  }

  /**
   * @private
   * @param {ParsedName} parsedName
   * @returns {OrmAdapter}
   */
  private lookupOrmAdapter(parsedName: ParsedName): OrmAdapter {
    return this._lookupOther(parsedName, {
      containerize: true,
      singleton: true,
      fallback: () => {
        if (!this.config.ormAdapter) {
          throw new Error('No default ORM adapter was defined in supplied in config.ormAdapter!');
        }
        return `orm-adapter:${ this.config.ormAdapter }`;
      }
    });
  }

  /**
   * @private
   * @param {ParsedName} parsedName
   * @returns {Serializer}
   */
  private lookupSerializer(parsedName: ParsedName): Serializer {
    return this._lookupOther(parsedName, {
      containerize: true,
      singleton: true,
      fallback: 'serializer:application'
    });
  }

  /**
   * @private
   * @param {any} Class
   * @returns {*}
   */
  // See https://github.com/Microsoft/TypeScript/pull/13743#issue-203908151
  private _containerizeClass<T extends Constructor<{}>>(Class: T) {
    let container = this; // eslint-disable-line consistent-this
    class ContaineredClass extends Class {
      static container = container;
      container = container;
    }
    Object.defineProperty(ContaineredClass, 'name', {
      value: Class.name,
      writable: false,
      configurable: true
    });
    return ContaineredClass;
  }

  /**
   * Take the supplied name which can come in several forms, and normalize it.
   *
   * @private
   * @param {string} name
   * @returns {ParsedName}
   */
  private parseName(name: string): ParsedName {
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
}


function result(value: any): any {
  if (typeof value === 'function') {
    return value();
  }
  return value;
}
