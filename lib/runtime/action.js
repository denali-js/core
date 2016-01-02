import ContainerObject from './container-object';
import Promise from 'bluebird';
import assign from 'lodash/object/assign';
import capitalize from 'lodash/string/capitalize';
import assert from 'assert';
import metaFor from './meta-for';

// A dummy "error" to reject with which indicates a before filter terminating a
// request before it completes.
const REQUEST_COMPLETE = Symbol('request complete');

const Action = ContainerObject.extend({

  // No-ops that can be overridden by Filters
  before() { return Promise.resolve(); },
  after() { return Promise.resolve(); },

  render() {
    this._rendered = true;
    return this.response.render(...arguments);
  },

  run() {
    let params = assign({}, this.request.query, this.request.body);
    let responder = this.respond;
    assert(typeof responder === 'function', `Your '${ this.name }' must define a respond method!`);
    if (this.request.get('accept') !== '*/*') {
      let availableFormats = [];
      /* eslint-disable guard-for-in */
      for (let key in this) {
        if (/^respondWith/.test(key)) {
          let format = key.match(/respondWith(.+)/)[1].toLowerCase();
          availableFormats.push(format);
        }
      }
      /* eslint-enable guard-for-in */
      if (availableFormats.length > 0) {
        let bestFormat = this.request.accepts(availableFormats);
        if (bestFormat) {
          responder = this['respondWith' + capitalize(bestFormat)];
        }
      }
    }
    responder = Promise.method(responder.bind(this, params));

    return this.before(params).cancellable()
      .then(responder)
      .then(this.after.bind(this, params))
      .then(() => {
        if (!this._isRequestComplete()) {
          this.next('You failed to finish your request. This is most likely caused by either failing to call `this.render()`, failing to return the promise which will eventually call `this.render()`, or failing to call this.response.send/json/etc');
        }
      })
      .catch((error) => {
        if (!error === REQUEST_COMPLETE) {
          this.next(error);
        }
      });
  },

  _isRequestComplete() {
    return this._rendered || this.response.headersSent;
  },

  log(level, ...msg) {
    return this.application.log(level, `[action:${ this.name }]`, ...msg);
  },

  toString() {
    return `<${ metaFor(this.constructor).containerPath }:${ metaFor(this).id }>`;
  }

});

let extend = Action.extend;
Action.extend = function extendFilter(...mixins) {
  // Wrap before/after filter methods with a call to super and promisify their
  // return value.
  mixins.forEach(function(mixin) {
    if (typeof mixin === 'function') {
      mixin = mixin.prototype;
    }

    if (mixin.before) {
      let before = mixin.before;
      mixin.before = function enforceBeforeFilterSuper() {
        let previousFilter = this._super(...arguments);
        return Promise.resolve(previousFilter)
          .then(() => {
            let filter = before.call(this, ...arguments);
            return Promise.resolve(filter);
          }).then(() => {
            if (this._isRequestComplete()) {
              return Promise.reject(REQUEST_COMPLETE);
            }
          });
      };
    }
    if (mixin.after) {
      let after = mixin.after;
      mixin.after = function enforceAfterFilterSuper() {
        let previousFilter = this._super(...arguments);
        return Promise.resolve(previousFilter)
          .then(() => {
            let filter = after.call(this, ...arguments);
            return Promise.resolve(filter);
          });
      };
    }
  });
  return extend.call(this, ...arguments);
};

export default Action;
