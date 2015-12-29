import CoreObject from 'core-object';
import assert from 'assert';
import mapValues from 'lodash/object/mapValues';
import assign from 'lodash/object/assign';

function findInjections(object, fn) {
  return mapValues(object, (value, key) => {
    if (value._injection === Symbol.for('denali:injection-flag')) {
      return fn(value, key);
    }
    return value;
  });
}

const DenaliObject = CoreObject.extend({
  init(options = {}) {
    findInjections(options, (injection, key) => {
      assert(options.container, 'You must supply a container to any DenaliObject with injections.');
      this[key] = options.container.lookup(injection.type, injection.name || key);
    });
    this.constructor._injections.forEach(({ injection, key }) => {
      assert(options.container, 'You must supply a container to any DenaliObject with injections.');
      this[key] = options.container.lookup({ type: injection.type, name: injection.name || key });
    });
    if (options.container) {
      this.config = options.config || options.container.lookup('config/environment');
    }
    this._super(...arguments);
  }
});

DenaliObject._injections = [];

let coreObjectExtend = CoreObject.extend;
DenaliObject.extend = function extendWithMixins(...mixins) {
  let Class = this;
  mixins.forEach((mixin) => {
    if (typeof mixin === 'function') {
      mixin = mixin.prototype;
    }
    let NewClass = coreObjectExtend.call(Class, mixin);
    assign(NewClass, Class);
    NewClass.prototype.constructor = NewClass;
    // Pulling injections on the constructor during design-time helps optimize
    // object creation. This way, we don't have to recurse over *all* (including
    // prototype) properties of the newly created instance to inject the
    // service. Instead, we compile the list of necessary injections only once,
    // during design-time, and then we only need to iterate over that list at
    // run-time.
    NewClass._injections = Class._injections.slice(0);
    findInjections(mixin, (injection, key) => {
      NewClass._injections.push({ injection, key });
    });
    NewClass.extend = extendWithMixins;
    Class = NewClass;
  });
  return Class;
};

export default DenaliObject;
