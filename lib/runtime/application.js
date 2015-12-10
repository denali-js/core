import assert from 'assert';
import express from 'express';
import Promise from 'bluebird';
import { log } from '../utils';
import Error from './error';
import Engine from './engine';
import blackburn from 'blackburn';

/**
 * Application instances are little more than specialized Engines, designed to
 * kick off the loading, mounting, and launching stages of booting up.
 *
 * @title Application
 */
export default Engine.extend({

  /**
   * There are three stages involved when booting up a Denali application:
   *
   * 1. **load stage** - the application loads it's configuration and code from
   * the filesystem. It also discovers any child engines present, and triggers
   * the same for them.
   *
   * 2. **mount stage** - the application assembles a unified picture of itself
   * based on it's own code and config, as well as those of the child engines it
   * discovered during the load stage.
   *
   * 3. **launch** - now that the application has merged in the child engines,
   * it is ready to launch the HTTP server, connect to a port, and begin
   * accepting connections.
   *
   * When you instantiate a new Application instances, the first two stages run
   * immediately. However, the application does not launch until you run the
   * `start()` method. This is useful if you want to load an Application into
   * memory to inspect or use, but without booting up the actual HTTP server.
   *
   * @constructor
   */
  init(options = {}) {
    options.environment = options.environment || process.env.DENALI_ENV || process.env.NODE_ENV || 'development';
    this._super.call(this, options);
    this.router = new express.Router();
  },

  /**
   * Launch this Application. Runs the initializers, then boots up the HTTP
   * server and binds to a port. Returns a Promise which resolves once the
   * server is live and accepting connections.
   *
   * @method start
   *
   * @return {Promise} resolves when the server has successfully bound to it's
   * port and is accepting connections
   */
  start() {
    this.load();

    return Promise.resolve(this.initializers)
      .each((initializer) => {
        return initializer(this);
      }).then(() => {
        return this.launchServer();
      });
  },

  /**
   * Boots up the express HTTP server, mounts the Application's router to it,
   * and binds the server to the Application's port.
   *
   * @method launchServer
   * @private
   *
   * @return {Promise} resolves when the server has successfully bound to it's
   * port and is accepting connections
   */
  launchServer() {
    return new Promise((resolve) => {
      this.server = express();
      this.injectBlackburnPlusForaker(this.server);
      this.server.use(this.router);
      this.server.use(this.handleErrors.bind(this));
      this.server.listen(this.port, resolve);
    }).then(() => {
      this.log(`${ this.pkg.name }@${ this.pkg.version } server up on port ${this.port}`);
    });
  },

  /**
   * A simple proxy for the utils/log module, which silences any logs if we are
   * currently testing
   *
   * @method log
   */
  log(level) {
    if (this.env !== 'test' || level === 'error') {
      log.apply(this, arguments);
    }
  },

  /* eslint-disable no-unused-vars */
  handleErrors(err, req, res, next) {
    if (!res._rendered) {
      if (!err.status) {
        err = new Error.InternalServerError(err.stack);
        this.log('error', err.stack);
      }
      err.code = err.code || err.name;
      return res.render(err);
    }
  },
  /* eslint-enable no-unused-vars */

  injectBlackburnPlusForaker(server) {
    // Setup vanilla blackburn installation
    server.use(blackburn({
      adapters: this.adapters,
      serializers: this.serializers
    }));
    // Now wrap blackburn's render method with one which picks the corresponding
    // serializer for that controller. This is the glue that joins the blackburn
    // serialization with foraker's controllers.
    server.use((req, res, next) => {
      // This controller property is injected into the context below, in the
      // handle method
      let render = res.render;
      res.render = (...args) => {
        // We need to identify options arg, which can be second or third.
        // It's only second when no status is supplied. It can be omitted as
        // well, so if it is, default it to an empty object.
        let options;
        if (typeof args[0] !== 'number' && !args[2]) {
          options = args[1] = args[1] || {};
        } else {
          options = args[2] = args[2] || {};
        }

        let controller = req.context && req.context.controller;
        options.serializer = options.serializer
                             || controller && controller.serializer
                             || controller && controller.name;
        options.adapter = options.adapter
                          || controller && controller.adapter
                          || controller && controller.name;
        return render.apply(res, args);
      };
      next();
    });
  },

  /**
   * Takes a controllerAction string and returns an express-compatible route
   * handler function that will route the request to that controller and action.
   * This is defined only on the Application since there is only one server
   * shared across all the Engines.
   *
   * @method handle
   * @private
   *
   * @param  {String} controllerAction  a string indicating the controller and
   * action that should be routed to. For example, `'books.create'` would route
   * to the `BooksController` `create` action.
   *
   * @return {Function} an express-compatible route handler function
   */
  handle(controllerAction) {
    let [ controllerName, actionName ] = controllerAction.split('.');
    let controller = this.controllers[controllerName];
    assert(controller, `Attempted to route to ${ controllerAction }, but ${ controllerName } controller not found.`);
    let action = controller.action(actionName);
    return function(req, res, next) {
      // Inject the controller into the incoming request (it's context object).
      let context = req.context = req.context || {};
      context.controller = context.controller || controller;
      action(req, res, next);
    };
  }

});
