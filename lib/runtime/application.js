import path from 'path';
import express from 'express';
import Promise from 'bluebird';
import Addon from './addon';
import topsort from '../utils/topsort';
import routerDSL from './router-dsl';
import Container from './container';
import forEach from 'lodash/collection/forEach';


/**
 * The runtime module contains all the classes used during the actual server
 * operation.
 *
 * @module denali
 * @submodule runtime
 */


/**
 * Application instances are little more than specialized Addons, designed to
 * kick off the loading, mounting, and launching stages of booting up.
 *
 * @class Application
 * @constructor
 * @extends Addon
 */
export default Addon.extend({

  init(options) {
    this.dispatcher = express();
    this.container = new Container({ application: this });
    this._super(...arguments);
    let baseAddon = new Addon({
      dir: path.join(__dirname, 'base'),
      environment: options.environment || this.environment,
      parent: this,
      container: this.container
    });
    this.addons.unshift(baseAddon);
    this.generateConfig();
    this.load(this.container);
    this.sortInitializers();
    this.drawRoutes();
    this.mergeMiddleware();
    this.assembleDispatcher();
  },

  generateConfig() {
    this.config = this._config(this.environment);
    this.container.register('config:environment', this.config);
    this.addons.forEach((addon) => {
      addon._config(this.environment, this.config);
    });
  },

  sortInitializers() {
    let initializers = [];
    forEach(this.container.lookup('initializer:*'), (initializer) => {
      initializers.push(initializer);
    });
    this.initializers = topsort(initializers);
  },

  mergeMiddleware() {
    this.middleware = express.Router();
    this.addons.forEach((addon) => {
      addon._middleware(this.middleware, this);
    });
    this._middleware(this.middleware, this);
  },

  drawRoutes() {
    this.routes = express.Router();
    this._routes.call(routerDSL(this), this);
    this.routes.use(this.router);
    this.addons.reverse().forEach((addon) => {
      addon._routes.call(routerDSL(this), this);
      this.routes.use(addon.router);
    });
  },

  createActionHandler(actionPath) {
    let application = this;
    let Action;
    try {
      Action = this.container.lookup('action:' + actionPath);
    } catch (error) {
      if (/No entry found/.test(error.message)) {
        throw new Error(`You tried to map a route to the '${ actionPath }' action, but no such action was found!\nAvailable actions: ${ Object.keys(this.container.lookup('action:*')) }`);
      }
      throw error;
    }
    return function invokeAction(req, res, next) {
      req._originalAction = actionPath;
      let action = new Action({
        actionPath,
        request: req,
        response: res,
        application,
        container: application.container,
        next
      });
      action.run();
    };
  },

  assembleDispatcher() {
    this.dispatcher.use(this.middleware);
    this.dispatcher.use(this.routes);
    this.dispatcher.use(this.errorHandler.bind(this));
  },

  errorHandler(err, req, res, next) {
    let ErrorAction = this.container.lookup('action:error');
    let errorAction = new ErrorAction({
      name: 'error',
      request: req,
      response: res,
      application: this,
      container: this.container,
      error: err,
      originalAction: req._originalAction,
      next
    });
    errorAction.run();
  },

  start(options = {}) {
    let port = this.config.server.port || 3000;
    return this.runInitializers()
      .then(() => {
        if (options.bind !== false) {
          return new Promise((resolve) => {
            this.dispatcher.listen(port, resolve);
          });
        }
      }).then(() => {
        this.log('info', `${ this.pkg.name }@${ this.pkg.version } server up on port ${ port }`);
      }).catch((err) => {
        this.log('error', 'Problem starting app ...');
        this.log('error', err.stack || err);
      });
  },

  runInitializers() {
    return Promise.resolve(this.initializers)
      .each((initializer) => {
        return initializer.initialize();
      });
  }

});
