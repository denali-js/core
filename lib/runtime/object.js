import assign from 'lodash/object/assign';
import metaFor from './meta-for';

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
};

DenaliObject.prototype.toString = function toString() {
  return `<DenaliObject:${ metaFor(this).id }>`;
};

DenaliObject.toString = function() {
  return this.prototype.toString().replace(':', 'Class:');
};

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
      let value = source[key];

      // Copy it to the subclass's prototype
      if (typeof value === 'function' && hasSuper(value)) {
        Class.prototype[key] = giveMethodSuper(Class.prototype, key, value);
      } else {
        Class.prototype[key] = value;
      }
    }
    /* eslint-enable guard-for-in */

    return Class;

  }, this);

};

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
