import assert from 'assert';
import DenaliObject from './object';
import forEach from 'lodash/collection/forEach';
import defaults from 'lodash/object/defaults';

const InjectedObject = DenaliObject.extend({
  init() {
    this._super(...arguments);
    if (Object.keys(this.constructor.injections).length !== 0 && !this.application) {
      console.log(this.constructor.injections);
    }
    assert(Object.keys(this.constructor.injections).length === 0 || this.application, 'You must supply an application instance to an injected object in order to use the `inject()` macro.');
    forEach(this.constructor.injections, ({ containerpath }, injectedKey) => {
      console.log('injecting', injectedKey);
      this[injectedKey] = this.application.lookup(containerpath);
    });
  }
});


let extend = InjectedObject.extend;
InjectedObject.extend = function extendAndInject(...mixins) {
  let Class = extend.call(this, ...mixins);
  Class.injections = Class.injections || {};
  mixins.forEach((mixin) => {
    if (mixin.injections) {
      defaults(Class.injections, mixin.injections);
    }
  });
  forEach(Class.prototype, (value, key) => {
    if (isInjection(value)) {
      Class.injections[key] = value;
    }
  });
  return Class;
};

function isInjection(value) {
  return value.injection === Symbol.for('denali:injection');
}

export default InjectedObject;
