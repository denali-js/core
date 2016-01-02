import assert from 'assert';
import mapValues from 'lodash/object/mapValues';
import forEach from 'lodash/collection/forEach';
import assign from 'lodash/object/assign';
import DenaliObject from './object';
import metaFor from './meta-for';

const ContainerObject = DenaliObject.extend({

  init(options = {}) {
    assert(options.container, 'You must supply a container to ContainerObjects.');
    let application = options.container.lookup('application/main');
    if (this.constructor._injections) {
      forEach(this.constructor._injections, (injection, key) => {
        this[key] = options.container.lookup({ type: injection.type, name: injection.name || key });
      });
    }
    options = mapValues(options, (value, key) => {
      if (isInjection(value)) {
        return options.container.lookup(value.type, value.name || key);
      }
      return value;
    });
    this._super(assign({ config: application.config }, options));
  },

  toString() {
    return `<ContainerObject:${ metaFor(this).id }>`;
  }

});

let extend = ContainerObject.extend;
ContainerObject.extend = function extendWithInjections(...mixins) {
  let injections = {};
  mixins.forEach(function eachMixin(mixin) {
    if (typeof mixin === 'function') {
      mixin = mixin.prototype;
    }
    forEach(mixin, function extractInjection(value, key) {
      if (isInjection(value, key)) {
        injections[key] = value;
      }
    });
  });
  let SubClass = extend.apply(this, arguments);
  SubClass._injections = assign({}, this._injections || {}, injections);
  return SubClass;
};

function isInjection(value) {
  return value && value._injection === Symbol.for('denali:injection-flag');
}

export default ContainerObject;
