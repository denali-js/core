/**
 * @module denali
 * @submodule runtime
 */
import path from 'path';
import http from 'http';
import https from 'https';
import express from 'express';
import Promise from 'bluebird';
import dotenv from 'dotenv';
import Addon from './addon';
import topsort from '../utils/topsort';
import routerDSL from './router-dsl';
import Logger from './logger';
import Container from './container';


/**
 * Application instances are little more than specialized Addons, designed to
 * kick off the loading, mounting, and launching stages of booting up. They also
 * manage the handoff from the express routing layer to the app's actions.
 *
 * @class Application
 * @constructor
 * @extends Addon
 */
export default class Application extends Addon {

  container = new Container();

  logger = new Logger();

  constructor(...args) {
    super(...args);
    this.includeBaseAddon();
    // Generate config first, since the loading process may need it
    this.config = this.generateConfig();
    // Kick off the recursive load of this application & all child addons
    this.load(this.container);
    this.dispatcher = this.buildDispatcher();
  }

  /**
   * Adds the default base addon to the application. The base addon includes
   * some helpful default functionality, like basic error handling and common
   * middleware. You can customize the included middleware via config. See
   * the [Configuration guide](/guides/configuration) for details.
   *
   * @method includeBaseAddon
   * @private
   */
  includeBaseAddon() {
    const baseAddon = new Addon({
      dir: path.join(__dirname, 'base'),
      environment: this.environment,
      parent: this,
      container: this.container
    });
    this.addons.unshift(baseAddon);
  }

  /**
   * Take the loaded environment config functions, and execute them.
   * Application config is executed first, and the returned config object is
   * handed off to the addon config files, which add their configuration by
   * mutating that same object.
   *
   * The resulting final config is stored at `application.config`, and is
   * registered in the container under `config:environment`.
   *
   * @method generateConfig
   * @return {Object} the generated config
   * @private
   */
  generateConfig() {
    dotenv.config({ silent: true });
    const config = this._config(this.environment);
    this.container.register('config:environment', config);
    this.addons.forEach((addon) => {
      addon._config(this.environment, config);
    });
    return config;
  }

  /**
   * Create a single unified express application that combines the middleware
   * and routes routers. Also adds a last-ditch global eror handler, which
   * should catch any errors from userland.
   *
   * @method buildDispatcher
   * @return {Router} an express Router that will handle incoming requests
   * @private
   */
  buildDispatcher() {
    const dispatcher = express();
    dispatcher.use(this.buildMiddleware());
    dispatcher.use(this.buildRoutes());
    dispatcher.use(this.buildErrorHandler());
    return dispatcher;
  }

  /**
   * Take the loaded route drawing functions and execute them in the context of
   * the routing DSL. Routes are mounted to a common router.
   *
   * @method buildRoutes
   * @return {Router} an express Router with the routes attached
   * @private
   */
  buildRoutes() {
    const routes = express.Router();
    this._routes.call(routerDSL(this), this);
    routes.use(this.router);
    this.addons.reverse().forEach((addon) => {
      addon._routes.call(routerDSL(this), this);
      routes.use(addon.router);
    });
    return routes;
  }

  /**
   * Take the loaded middleware functions and execute them, providing a router
   * to attach middleware to.
   *
   * @method buildMiddleware
   * @return {Router} an express Router with the middleware attached
   * @private
   */
  buildMiddleware() {
    const middleware = express.Router();
    this.addons.forEach((addon) => {
      addon._middleware(middleware, this);
    });
    this._middleware(middleware, this);
    return middleware;
  }

  /**
   * Returns an express error handler function that is the "last-ditch" error
   * handler. Any userland errors that make it this far are captured and
   * forwarded to the `error` action. The base addon provides a simple error
   * action out of the box, but users can override it by defining their own.
   *
   * @method buildErrorHandler
   * @return {Function} express error handler function
   */
  buildErrorHandler() {
    return (err, req, res, next) => {
      console.log(res);
      let ErrorAction = this.container.lookup('action:error');
      let errorAction = new ErrorAction({
        actionPath: 'error',
        request: req,
        response: res,
        application: this,
        container: this.container,
        error: err,
        next
      });
      errorAction.run();
    };
  }

  /**
   * Start the Denali server. Runs all initializers, creates an HTTP server,
   * and binds the express app to it to handle incoming HTTP requests.
   *
   * @method start
   * @return {Promise} resolves when the startup completes
   */
  start() {
    let port = this.config.server.port || 3000;
    return this.runInitializers()
      .then(() => {
        if (!this.config.server.detached) {
          return new Promise((resolve) => {
            let server;
            if (this.config.server.ssl) {
              server = https.createServer(this.config.server.ssl, this.dispatcher);
            } else {
              server = http.createServer(this.dispatcher);
            }
            server.listen(port, resolve);
          }).then(() => {
            this.logger.info(`${ this.pkg.name }@${ this.pkg.version } server up on port ${ port }`);
          });
        }
      }).catch((err) => {
        this.logger.error('Problem starting app ...');
        this.logger.error(err.stack || err);
      });
  }

  /**
   * Lookup all initializers and run in them in sequence. Initializers can
   * override the default load order by including `before` or `after`
   * properties on the exported class (the name or array of names of the other
   * initializers it should run before/after).
   *
   * @method runInitializers
   * @return {Promise} resolves when all the initializers have completed
   * @private
   */
  runInitializers() {
    let initializers = topsort(this.container.lookupAll('initializer'));
    return Promise.resolve(initializers)
      .each((initializer) => {
        return initializer.initialize(this);
      });
  }

  /**
   * Given an actionPath, return an express route handler function that will
   * invoke the specified action with the incoming request. This is the bridge
   * from the express world of handler functions to Denali's action classes.
   *
   * @method createActionHandler
   * @param actionPath {String}
   * @return {Function} express route handler function
   */
  createActionHandler(actionPath) {
    const application = this;
    let Action;
    try {
      Action = this.container.lookup(`action:${ actionPath }`);
    } catch (error) {
      if (/No entry found/.test(error.message)) {
        throw new Error(`You tried to map a route to the '${ actionPath }' action, but no such action was found!\nAvailable actions: ${ Object.keys(this.container.lookup('action:*')) }`);
      }
      throw error;
    }
    return function invokeAction(req, res, next) {
      req._originalAction = actionPath;
      const action = new Action({
        actionPath,
        request: req,
        response: res,
        application,
        container: application.container,
        next
      });
      action.run();
    };
  }

}
