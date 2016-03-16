/**
 * @module denali
 * @submodule runtime
 */
import { Injection } from './inject';
import assign from 'lodash/object/assign';
import contains from 'lodash/contains';


/**
 * `Denali.Object` is the base class for all Denali classes. It provides a basic
 * _super implementation to allow for easier subclassing, and integrates with
 * the Container to allow for dependency injection.
 *
 * @class Object
 * @namespace Denali
 */

export default function DenaliObject(options) {
  if (!(this instanceof DenaliObject)) {
    throw new TypeError("Please use the 'new' operator, this object constructor cannot be called as a function.");
  }

  this.init(options);
}

/**
 * Called on object initialization. You can override with your own intialization
 * logic. If you do override, you **must** call `_super()` to ensure the rest
 * of the object initialization happens.
 *
 * @method init
 * @param  options {Object}
 */
DenaliObject.prototype.init = function init(options) {
  if (options) {
    assign(this, options);
  }
};

/**
 * Returns a String representation of the Object that is singleton and container
 * aware.
 *
 * @example
 *
 *     singleton.toString()  // <MySingleton>
 *     instance.toString()   // <instance of MyClass (foo, bar, bat ...)>
 *
 * @method toString
 * @returns {String}
 * @static
 */
DenaliObject.toString = denaliObjectToString;
DenaliObject.prototype.toString = denaliObjectToString;

/**
 * A list of property names of arrays that should be concantenated rather than
 * overridden when subclassing.
 *
 * @property {Array}
 * @static
 * @private
 */
DenaliObject.concatenatedProperties = [];

/**
 * Create a subclass based on this class. Instances of the subclass will pass
 * `instanceof` checks.
 *
 * @example
 *
 *     let Subclass = Denali.Object.extend(MyMixin, {
 *       foo: 'bar'
 *     });
 *     let subclassInstance = new Subclass();
 *     subclassInstance instanceof Denali.Object // true
 *
 * @method extend
 * @param ...mixins {Object} mixins & class definition to apply to th subclass
 * @return {Class}
 * @static
 */
DenaliObject.extend = function(...mixins) {

  return mixins.reduce((ParentClass, mixin) => {

    // Create a new constructor function to represent the subclass
    function Class(options) {
      this.init(options);
    }

    // Force the constructor/static class itself to point to it's parent static
    // class as it's proto
    /* eslint-disable no-proto */
    Class.__proto__ = ParentClass;
    /* eslint-enable no-proto */

    // Set the new class's prototype to inherit from parent class prototype.
    // Props assigned to the child prototype won't affect the parent now
    Class.prototype = Object.create(ParentClass.prototype);
    Class.prototype.constructor = Class;

    // For each prop (including inherited ones) of the mixin
    /* eslint-disable guard-for-in */
    let source = typeof mixin === 'function' ? mixin.prototype : mixin;

    for (let key in source) {
      // Don't overwrite the constructor we just built
      if (key === 'constructor') continue;
      let value = source[key];

      // Copy it to the subclass's prototype
      if (isInjection(value)) {
        Object.defineProperty(Class.prototype, key, {
          configurable: true,
          enumerable: true,
          get: value.getter,
          set: value.setter
        });
      } else if (typeof value === 'function') {
        if (hasSuper(value)) {
          Class.prototype[key] = giveMethodSuper(Class.prototype, key, value);
        } else if (key === 'init') {
          console.log('Warning: subclassed `init()` did not call this._super. Did you forget to?');
          Class.prototype[key] = value;
        }
      } else if (contains(ParentClass.concatenatedProperties, key)) {
        if (!Class.prototype[key]) {
          Class.prototype[key] = ParentClass.prototype[key].slice();
        }
        Class.prototype[key] = Class.prototype[key].concat(value);
      } else {
        Class.prototype[key] = value;
      }
    }
    /* eslint-enable guard-for-in */

    return Class;

  }, this);

};

/**
 * Syntatic sugar for:
 *
 *     new Class.extend(...mixins);
 *
 * @method create
 * @param ...mixins {Object}
 * @return {Object}
 * @static
 */
DenaliObject.create = function createWithMixins(...mixins) {
  let Class = this.extend(...mixins);
  return new Class();
};


function isInjection(value) {
  return value instanceof Injection;
}

function giveMethodSuper(superclass, name, fn) {
  let superFn = superclass[name];

  if (typeof superFn !== 'function') {
    superFn = function() {};
  }

  return function wrapSuper() {
    let previous = this._super;
    this._super = superFn;
    let ret = fn.apply(this, arguments);
    this._super = previous;
    return ret;
  };
}

function hasSuper(fn) {
  if (fn.__hasSuper === undefined) {
    fn.__hasSuper = fn.toString().indexOf('_super') > -1;
  }
  return fn.__hasSuper;
}

function denaliObjectToString() {
  if (this.container) {
    if (typeof this === 'function' || this.constructor.singleton) {
      return `<${ this.__meta.parsedName.fullName }>`;
    }
    return `<instance of ${ this.__meta.parsedName.fullName}>`;
  }
  if (typeof this === 'function') {
    return `<UnknownClass>`;
  }
  return `<instance of ${ this.constructor.name }>`;
}
