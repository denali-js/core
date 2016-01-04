import assert from 'assert';
import path from 'path';
import express from 'express';
import Promise from 'bluebird';
import Addon from './addon';
import metaFor from './meta-for';
import merge from 'lodash/object/merge';
import topsort from '../utils/topsort';
import get from 'lodash/object/get';
import routerDSL from './router-dsl';


/**
 * Application instances are little more than specialized Addons, designed to
 * kick off the loading, mounting, and launching stages of booting up.
 *
 * @title Application
 */
export default Addon.extend({

  init() {
    this.dispatcher = express();
    this._super(...arguments);
    // Mount config first to allow for static config
    this.mountConfig();
    this.load();
    this.mount();
  },

  discoverAddons() {
    this._super(...arguments);
    this.addons.unshift(new Addon({
      dir: path.join(__dirname, 'base'),
      environment: this.environment,
      parent: this
    }));
  },

  mount() {
    this.mountApp();
    this.mountInitializers();
    this.mountMiddleware();
    this.mountRoutes();
    this.mountDispatcher();
  },

  mountConfig() {
    this.config = this._config(this.environment);
    this.addons.forEach((addon) => {
      addon._config(this.environment, this.config);
    });
  },

  mountApp() {
    this.container = {};
    this.addons.forEach((addon) => {
      merge(this.container, addon._container);
    });
    merge(this.container, this._container);
  },

  mountInitializers() {
    let initializers = [];
    this.addons.forEach((addon) => {
      initializers.push(...addon._initializers);
    });
    initializers.push(...this._initializers);
    this.initializers = topsort(initializers, { valueKey: 'initialize' });
  },

  mountMiddleware() {
    this.middleware = express.Router();
    this.addons.forEach((addon) => {
      addon._middleware(this.middleware, this);
    });
    this._middleware(this.middleware, this);
  },

  mountRoutes() {
    this.routes = express.Router();
    this._routes.call(routerDSL(this), this);
    this.routes.use(this.router);
    this.addons.reverse().forEach((addon) => {
      addon._routes.call(routerDSL(addon), addon);
      this.routes.use(addon.router);
    });
  },

  mountDispatcher() {
    this.dispatcher.use(this.middleware);
    this.dispatcher.use(this.routes);
    this.dispatcher.use(this.errorHandler.bind(this));
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
        return initializer(this);
      });
  },

  errorHandler(err, req, res, next) {
    let ErrorAction = this.lookup('actions/error');
    let errorAction = new ErrorAction({
      name: 'error',
      request: req,
      response: res,
      application: this,
      error: err,
      originalAction: req._originalAction,
      next
    });
    errorAction.run();
  },

  createActionHandler(actionPath) {
    let application = this;
    let Action = this.lookup('actions/' + actionPath);
    assert(Action, `You tried to map a route to the '${ actionPath }' action, but no such action was found!\nAvailable actions: ${ Object.keys(this.container.actions) }`);
    return function invokeAction(req, res, next) {
      req._originalAction = actionPath;
      let action = new Action({
        name: actionPath,
        request: req,
        response: res,
        application,
        next
      });
      action.run();
    };
  },

  lookup(containerpath) {
    containerpath = containerpath.replace('/', '.');
    return get(this.container, containerpath);
  },

  toString() {
    return `<Application:${ metaFor(this).id }>`;
  }

});
