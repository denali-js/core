/**
 * @module denali
 * @submodule runtime
 */
import Instrumentation from './instrumentation';
import Promise from 'bluebird';
import assign from 'lodash/assign';
import capitalize from 'lodash/capitalize';
import assert from 'assert';


function PreemptiveRender() {}
PreemptiveRender.prototype = Object.create(Error.prototype);
PreemptiveRender.prototype.constructor = PreemptiveRender;


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
export default class Action {

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
  static before = [];

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
  static after = [];

  get config() { return this.container.lookup('config:environment') }

  render(response) {
    if (!(response instanceof Response)) {
      response = new Response(200, response);
    }

    response.options.action = this;

    let sample = isArray(response.body) ? response.body[0] : response.body;
    if (response.raw !== true && sample instanceof Model || sample instanceof Error) {

      let type = sample instanceof Error ? 'error' : sample.type;
      let Serializer = this.container.lookup(`serializer:${ type }`);
      let serializer = new Serializer(this, response.options);
      response.body = serializer.serialize(response.body);

    }

    this.response.status(response.status).json(response.body);
  }

  /**
   * Invokes the action. Determines the best responder method for content
   * negotiation, then executes the filter/responder chain in sequence,
   * handling errors and rendering the response.
   *
   * You shouldn't invoke this directly - Denali will automatically wire up
   * your routes to this method.
   *
   * @method run
   * @return {Promise} resolves when the filter/responder chain is complete,
   * i.e. when the action is finished
   * @private
   */
  run() {
    // Merge all available params into a single convenience object. The
    // original params (query, body, url) can all be accessed at their original
    // locations still if you want.
    let params = assign({}, this.request.params, this.request.query, this.request.body);

    // Content negotiation. Pick the best responder method based on the incoming
    // content type and the available responder types.
    let respond = this._pickBestResponder().bind(this, params);

    // Build the before and after filter chains
    let { beforeChain, afterChain } = this._buildFilterChains();

    let render = this.render.bind(this.response);

    return Instrumentation.instrument('action.run', {
      action: this.name,
      params,
      headers: this.request.headers,
      format: bestFormat
    }, () => {
      return this._invokeFilters(beforeChain, params)
        .then(respond)
        .then(render)
        .then(invokeFilters.bind(this, afterChain, params))
        .catch(PreemptiveRender, noop)
        .catch(Errors.HttpError, render)
        .catch(this.next)
        .then(() => { status: this.response.statusCode });
    });
  }

  _pickBestResponder() {
    let responder = this.respond;
    let bestFormat;
    assert(typeof responder === 'function', `Your '${ this.name }' action must define a respond method.`);
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
        bestFormat = this.request.accepts(availableFormats);
        if (bestFormat) {
          responder = this[`respondWith${ capitalize(bestFormat) }`];
        }
      }
    }
    return responder;
  }

  _buildFilterChains() {
    if (!this.constructor._before) {
      let prototypeChain = [];
      let prototype = this.constructor;
      while(prototype !== Function) {
        prototypeChain.push(prototype);
        prototype = Object.getPrototypeOf(prototype);
      }
      [ 'before', 'after' ].forEach((stage) => {
        let filterNames = uniq(flatten(map(prototypeChain, stage)));
        filterNames.forEach((filterName) => {
          if (!this[filterName]) {
            throw new Error(`${ filterName } method not found on the ${ this.name } action.`);
          }
        });
        this.constructor[`_${ stage }`] = filterMethods;
      });
    }
    return {
      beforeChain: this.constructor._before,
      afterChain: this.constructor._after
    };
  }

  _invokeFilters(params, chain) {
    return Promise.resolve(chain)
      .each((filterName) => {
        let filter = Promise.method(this[filterName]);
        return Instrumentation.instrument('action.filter', {
          action: this.name,
          params,
          filter: filterName,
          headers: this.request.headers
        }, () => {
          return filter(params).then((result) => {
            if (result != null) {
              this.response.render(result);
              return Promise.reject(new PreemptiveRender());
            }
          });
      });
  }

}
