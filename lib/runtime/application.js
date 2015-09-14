import assert from 'assert';
import express from 'express';
import Promise from 'bluebird';
import { log } from '../utils';
import Engine from './engine';

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
  init() {
    this._super.apply(this, arguments);
    this.router = new express.Router();
    this.mountConfig(this);
    this.mountInitializers(this);
    this.mountMiddleware(this);
    this.mountAdapters(this);
    this.mountControllers(this);
    this.mountJobs(this);
    this.mountSerializers(this);
    this.mountRoutes(this);
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
      this.server.use(this.router);
      this.server.listen(3000, resolve);
    }).then(() => {
      log(`${ this.pkg.name }@${ this.pkg.version } server up on port 3000`);
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
    return controller.action.bind(controller, actionName);
  }

});
