import DenaliObject from './object';
import Promise from 'bluebird';
import assign from 'lodash/object/assign';
import capitalize from 'lodash/string/capitalize';
import assert from 'assert';

// A dummy "error" to reject with which indicates a before filter terminating a
// request before it completes.
const REQUEST_COMPLETE = Symbol('request complete');

const Action = DenaliObject.extend({

  // These must return a promise - they represent the base of the _super chain
  // for their respective filter stages. See the customizations to the
  // Action.extend() method below.
  before() { return Promise.resolve(); },
  after() { return Promise.resolve(); },

  // Hand off to the renderer, and mark this action as rendered so we can warn
  // on double render calls.
  render() {
    this._rendered = true;
    return this.response.render(...arguments);
  },

  // If no response was rendered, do it automatically using the return value
  // (or resolved value if a promise is returned) of the action's `respond()`
  // method.
  _autorender(result) {
    if (!this._isRequestComplete()) {
      this.render(result);
    }
  },

  _handleError(error) {
    // There actually is no error - the request was completed in the before
    // block, and in order to escape the sequence of _super promise calls, we
    // throw a specific error value to halt the promise chain
    if (error === REQUEST_COMPLETE) {
      return null;
    }
    // An HTTP error was thrown (i.e. a error, not an exception), and the
    // request was not yet completed. This is likely the result of simply
    // returning a promise which could reject with an error. Just pass it off
    // to the renderer to render as a normal error response.
    if (!this._isRequestComplete() && error.statusCode) {
      return this.render(error);
    }
    // An exception was generated (i.e. an error that was not anticpiated or
    // handled in userland code, like a TypeError rather than a DocumentNotFound
    // error). Pass it off to the next error handling middleware (which will be
    // the application's `errorHandler` function).
    this.next(error);
  },

  run() {
    // Merge all available params into a single convenience object. The original
    // params (query, body, url) can all be accessed at their original locations
    // still if you want.
    let params = assign({}, this.request.params, this.request.query, this.request.body);

    // Content negotiation. Pick the best responder method based on the incoming
    // content type and the available responder types.
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

    // Execute the action - before filters -> responder -> after filters
    let autorender = this._autorender.bind(this);
    let handleError = this._handleError.bind(this);
    return this.before(params)
      .then(responder)
      .then(autorender)
      .catch(handleError)
      .then(this.after.bind(this, params))
      .catch(handleError);
      // TODO is this necessary?
      // .then(() => {
      //   if (!this._isRequestComplete()) {
      //     this.next('You failed to finish your request. This is most likely caused by either failing to call `this.render()`, failing to return the promise which will eventually call `this.render()`, or failing to call this.response.send/json/etc');
      //   }
  },

  // Shortcut for checking if `this.render()` was called, or the response was
  // manually rendered directly.
  _isRequestComplete() {
    return this._rendered || this.response.headersSent;
  },

  log(level, ...msg) {
    return this.application.log(level, `[action:${ this.name }]`, ...msg);
  }

});

let extend = Action.extend;
Action.extend = function forceFilterSuper(...mixins) {
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
