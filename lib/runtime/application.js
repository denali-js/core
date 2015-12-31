import assert from 'assert';
import express from 'express';
import Promise from 'bluebird';
import DAG from 'dag-map';
import Addon from './addon';
import Container from './container';
import blackburn from 'blackburn';
import morgan from 'morgan';
import merge from 'lodash/object/merge';

import timing from 'response-time';
import compression from 'compression';
import cookies from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import requestid from 'express-request-id';
import forceSSL from 'express-force-ssl';

/**
 * Application instances are little more than specialized Addons, designed to
 * kick off the loading, mounting, and launching stages of booting up.
 *
 * @title Application
 */
export default Addon.extend({

  isApplication: true,

  init(options = {}) {
    options.container = new Container();
    options.container.register('application/main', this);
    options.container.addChildContainer(this._createDefaultContainer());
    this._super(...arguments);
    this.dispatcher = express();
    this.mount();
  },

  _createDefaultContainer() {
    let defaultContainer = new Container();
    defaultContainer.register('actions/error', require('./default-container/error-action'));
    return defaultContainer;
  },

  mount() {
    this.mountConfig();
    this.sortInitializers();
    this.mountAddonRouters();
  },

  mountConfig() {
    this.config = this._config(this.environment);
    this.eachAddon((addon) => {
      addon._config(this.environment, this.config);
    }, { childrenFirst: false });
    this.container.register('config/environment', this.config);
  },

  sortInitializers() {
    let initializers = this._initializers;
    this.eachAddon((addon) => {
      initializers.push(...addon._initializers);
    });
    let initializerGraph = new DAG();
    initializers.forEach((initializer) => {
      initializerGraph.addEdges(initializer.name, initializer.initialize, initializer.before, initializer.after);
    });
    this.initializers = [];
    initializerGraph.topsort(({ value }) => {
      this.initializers.push(value);
    });
  },

  mountAddonRouters() {
    this.eachAddon((addon) => {
      let namespace = this._addonMounts[addon.name] || addon.defaultNamespace || '/';
      this.router.use(namespace, addon.router);
    });
  },

  start(options = {}) {
    let port = this.config.server.port;
    this.instantiateServices();
    return this.runInitializers()
      .then(() => {
        this.assembleDispatcher();
        if (options.bind !== false) {
          return new Promise((resolve) => {
            this.dispatcher.listen(port, resolve);
          }).then(() => {
            this.log('info', `${ this.pkg.name }@${ this.pkg.version } server up on port ${ port }`);
          });
        }
      }).catch((err) => {
        this.log('error', 'Problem starting app ...');
        this.log('error', err.stack || err);
      });
  },

  instantiateServices() {
    this.services = this.container.lookupType('services');
  },

  runInitializers() {
    return Promise.resolve(this.initializers)
      .each((initializer) => {
        return initializer(this);
      });
  },

  assembleDispatcher() {
    this.dispatcher.use(this.defaultMiddleware());
    this.dispatcher.use(this.router);
    this.dispatcher.use(this.errorMiddleware());
  },

  defaultMiddleware() {
    let router = express.Router();
    router.use(this.errorMiddleware());
    router.use(timing());
    router.use(requestid());
    router.use(this.loggerMiddleware());
    let securityConfig = this.config.security || {};
    router.use(helmet.csp({
      directives: merge({ reportUri: '/_report-csp-violations' }, securityConfig && securityConfig.csp),
      reportOnly: this.environment === 'development',
      disableAndroid: true
    }));
    if (this.environment === 'development') {
      router.post('/_report-csp-violations', (req, res) => { res.sendStatus(200); });
    }
    router.use(helmet.xssFilter());
    router.use(helmet.frameguard());
    router.use(helmet.hidePoweredBy());
    router.use(helmet.ieNoOpen());
    router.use(helmet.noSniff());
    router.use(compression());
    router.use(cors(securityConfig.cors));
    router.use(cookies());
    router.use(blackburn({
      adapters: this.container.lookupType('adapters'),
      serializers: this.container.lookupType('serializers')
    }));

    if (securityConfig.requireSSL) {
      router.use((req, res, next) => {
        res.locals = res.locals || {};
        res.locals.forceSSLOptions = { enable301Redirects: securityConfig.redirectToSSL };
        forceSSL(req, res, next);
      });
    }

    return router;
  },

  loggerMiddleware() {
    const loggerFormats = {
      'development': 'dev',
      'production': 'combined'
    };
    return morgan(loggerFormats[this.environment] || 'dev', {
      skip: () => { return this.enviroment !== 'test'; }
    });
  },

  errorMiddleware() {
    let application = this;
    let ErrorAction = this.container.lookup('actions/error');
    return function errorHandler(err, req, res, next) {
      let errorAction = new ErrorAction({
        container: application.container,
        name: 'error',
        request: req,
        response: res,
        application,
        error: err,
        originalAction: req._originalAction,
        next
      });
      errorAction.run();
    };
  },

  handlerForAction(actionPath) {
    let application = this;
    let Action = this.container.lookup('actions/' + actionPath);
    assert(Action, `You tried to map a route to the '${ actionPath }' action, but no such action was found!\nAvailable actions: ${ Object.keys(this.container.lookupType('actions')).join(', ') }`);
    return function invokeActionForRoute(req, res, next) {
      req._originalAction = actionPath;
      let action = new Action({
        container: application.container,
        name: actionPath,
        request: req,
        response: res,
        application,
        next
      });
      action.run();
    };
  }

});
