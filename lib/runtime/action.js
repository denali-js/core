/**
 * @module denali
 * @submodule runtime
 */
import DenaliObject from './object';
import Promise from 'bluebird';
import assign from 'lodash/object/assign';
import capitalize from 'lodash/string/capitalize';
import assert from 'assert';

/*
 * A dummy "error" to reject with which indicates a before filter terminating
 * a request before it completes.
 */
const REQUEST_COMPLETE = Symbol('request complete');


/**
 * Actions form the core of interacting with a Denali application. They are
 * the controller layer in the MVC architecture, taking in incoming requests,
 * performing business logic, and handing off to the renderer to send the
 * response.
 *
 * When a request comes in, Denali will invoke the `respond` method on the
 * matching Action class. This method can directly render a response, or just
 * return data (or a promise which resolves with data) to be rendered.
 *
 * ## Actions as controllers
 *
 * Actions are probably a bit different than most controllers you might be
 * used to. Rather than a single controller class that handles multiple
 * different HTTP endpoints, Actions represent just one endpoint (URL + verb).
 *
 * This might seem like overkill at first, but it enables powerful declarative
 * abstractions now that there is a 1:1 relationship between a class and
 * endpoint.
 *
 * Want to validate incoming request bodies? Just define a schema property on
 * the action class itself, and a validation filter on the base class, and
 * you've got easy to understand declarative validation:
 *
 * ```js
 * export default Action.extend(RolesFilter, {
 *   validate: {
 *     type: 'object',
 *     required: [ 'firstName', 'lastName']
 *   },
 *   respond() {
 *     // ...
 *   }
 * });
 * ```
 *
 * Or how about access controls? Just add an `allow` array and a roles filter:
 *
 * ```js
 * export default Action.extend(RolesFilter, {
 *   allow: [ 'admins' ],
 *   respond() {
 *     // ...
 *   }
 * });
 * ```
 *
 * Filters are supplied via the `before` or `after` arrays, and they accumulate
 * from parent classes.
 *
 * @class Action
 * @constructor
 */
const Action = DenaliObject.extend({

  /**
   * Invoked before the `respond()` method, in the same order the mixins were
   * applied. They can be synchronous, or return a promise (which will pause
   * the before/respond/after chain until it resolves).
   *
   * If a before filter renders a response, any remaining filters as well as the
   * `respond()` method are skipped.
   *
   * @property before
   * @type {Array}
   * @default []
   */
  before: [],

  /**
   * Invoked after the `respond()` method, in the same order the mixins were
   * applied. They can be synchronous, or return a promise (which will pause
   * the before/respond/after chain until it resolves).
   *
   * If a before filter renders a response, any remaining filters as well as
   * the `respond()` method are skipped. After filters are still called if the
   * `respond()` method renders a response though.
   *
   * @property after
   * @type {Array}
   * @default []
   */
  after: [],

  /**
   * Renders a response, and marks the action as complete.
   *
   * @method render
   * @return {Promise} resolves when the render finishes
   */
  render() {
    this._rendered = true;
    return this.response.render(...arguments);
  },

  /**
   * If no response was rendered, do it automatically using the return value
   * (or resolved value if a promise is returned) of the action's `respond()`
   * method.
   *
   * @method _autorender
   * @param result {any} the return value of respond; if a Promise, use the
   * resolved value
   * @private
   */
  _autorender(result) {
    if (!this._isRequestComplete()) {
      this.render(result);
    }
  },

  /**
   * If a promise in the filter/responder chain rejects, this method figures out
   * how to handle the rejection. If a before filter prematurely renders a
   * response, it will reject with the REQUEST_COMPLETE Symbol as a reason,
   * which effectively is just cancelling the promise chain.
   *
   * @method _handleError
   * @param error {any} the rejection value
   * @return {null|Promise} returns null if it's just a cancellation, or another
   * promise that resolves when the error is rendered (if it's an actual error)
   */
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
    // handled in userland code, like a TypeError rather than a UserNotFound
    // error). Pass it off to the next error handling middleware (which will be
    // the application's `errorHandler` function).
    this.next(error);
  },

  /**
   * Invokes the action. Determines the best responder method for content
   * negotiation, then executes the filter/responder chain in sequence, handling
   * errors and autorendering the result if render isn't called directly.
   *
   * You shouldn't have to invoke this directly - Denali will automatically
   * wire up your routes to this method.
   *
   * @method run
   * @return {Promise} resolves when the filter/responder chain is complete,
   * i.e. when the action is finished
   * @private
   */
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
    let invokeFilter = this._invokeFilter.bind(this, params);
    return Promise.resolve(this.before)
      .each(invokeFilter)
      .then(responder)
      .then(autorender)
      .catch(handleError)
      .then(() => Promise.resolve(this.after))
      .each(invokeFilter)
      .catch(handleError);
  },

  /**
   * Invoke the supplied filter. If a string is provided, call the method with
   * that name. Otherwise, you must supply a function which will be invoked
   * directly with the Action as the context.
   *
   * @method _invokeFilter
   * @param filter {String|Function}
   * @return {any}
   * @private
   */
  _invokeFilter(params, filter) {
    if (typeof filter === 'string') {
      assert(typeof this[filter] !== 'function', `Unable to run filter: no method called ${ filter } was found on the action.`);
      return this[filter](params);
    }
    return filter.call(this, params);
  },

  /**
   * Has the response been rendered (or a render been requested and we are
   * waiting for something async to resolve)?
   *
   * @method _isRequestComplete
   * @return {Boolean}
   * @private
   */
  _isRequestComplete() {
    return this._rendered || this.response.headersSent;
  },

  log(level, ...msg) {
    return this.application.log(level, `[action:${ this.name }]`, ...msg);
  }

});

Action.concatenatedProperties = [ 'before', 'after' ];

export default Action;
