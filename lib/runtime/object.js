import assert from 'assert';
import assign from 'lodash/object/assign';
import forEach from 'lodash/collection/forEach';
import without from 'lodash/array/without';
import isEmpty from 'lodash/lang/isEmpty';
import isObject from 'lodash/lang/isObject';

export default function DenaliObject(options) {
  if (!(this instanceof DenaliObject)) {
    throw new TypeError("Please use the 'new' operator, this object constructor cannot be called as a function.");
  }
  this.init(options);
}

DenaliObject.prototype.init = function init(options) {
  if (options) {
    assign(this, options);
  }

  let injections = this.constructor.injections;
  if (injections && !isEmpty(injections)) {
    assert(this.container, `You must supply a reference to the container for objects with injections (${ Object.keys(injections) })`);
    forEach(injections, (injection, key) => {
      let value = this.container.lookup(injection.fullName);
      if (value === null || value === undefined) {
        let type = this.container.parseName(injection.fullName).type;
        let entries = Object.keys(this.container.lookup(injection.type + ':*')).join(', ');
        throw new Error(`You tried to inject '${ injection.fullName }' into ${ this.toString() }, but no such entry exists in the container. Available entries for '${ type }' type: ${ entries }`);
      }
      this[key] = value;
    });
  }
};

function denaliObjectToString() {
  if (this.container) {
    let meta = this.container.metaFor(this);
    if (meta && meta.name) {
      if (typeof this === 'function' || this.constructor.singleton) {
        return `<${ meta.name.fullName }>`;
      }
      return `<instance of ${ meta.name.fullName}(${ prototypeSample(this.constructor.prototype).join(', ') }...)>`;
    }
  }
  if (typeof this === 'function') {
    return `<UnknownClass(${ Object.keys(this.prototype).slice(0, 3).join(', ') }...)>`;
  }
  return `<instance of ${ this.constructor.name }(${ prototypeSample(this.constructor.prototype).join(', ') }...)>`;
}

function prototypeSample(proto) {
  return without(Object.keys(proto), 'constructor').slice(0, 3);
}

DenaliObject.toString = denaliObjectToString;
DenaliObject.prototype.toString = denaliObjectToString;

DenaliObject.injections = {};

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

    Class.injections = assign({}, ParentClass.injections);

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
      if (typeof value === 'function' && hasSuper(value)) {
        Class.prototype[key] = giveMethodSuper(Class.prototype, key, value);
      } else {
        Class.prototype[key] = value;
      }

      if (isInjection(value)) {
        Class.injections[key] = value;
      }
    }
    /* eslint-enable guard-for-in */

    return Class;

  }, this);

};

DenaliObject.create = function createWithMixins(...mixins) {
  let Class = this.extend(...mixins);
  return new Class();
};

function isInjection(value) {
  return isObject(value) && value.injection === Symbol.for('denali:object:injection');
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
