import assert from 'assert';
import express from 'express';
import Promise from 'bluebird';
import DAG from 'dag-map';
import Engine from './engine';
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
 * Application instances are little more than specialized Engines, designed to
 * kick off the loading, mounting, and launching stages of booting up.
 *
 * @title Application
 */
export default Engine.extend({

  isApplication: true,

  init(options = {}) {
    options.container = new Container();
    options.container.addChildContainer(this._createDefaultContainer());
    this._super(...arguments);
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
    this.mountEngineRouters();
  },

  mountConfig() {
    this.config = this._config(this.environment);
    this.eachEngine((engine) => {
      engine._config(this.environment, this.config);
    }, { childrenFirst: false });
  },

  sortInitializers() {
    let initializers = this._initializers;
    this.eachEngine((engine) => {
      initializers.push(...engine._initializers);
    });
    let initializerGraph = new DAG();
    initializers.forEach((initializer) => {
      initializerGraph.addEdges(initializer.name, initializer.initializer, initializer.before, initializer.after);
    });
    this.initializers = [];
    initializerGraph.topsort(({ value }) => {
      this.initializers.push(value);
    });
  },

  mountEngineRouters() {
    this.eachEngine((engine) => {
      let namespace = this._engineMounts[engine.name] || engine.defaultNamespace || '/';
      this.router.use(namespace, engine.router);
    });
  },

  start() {
    let port = this.config.server.port;
    return this.runInitializers()
      .then(() => {
        return this.startServer(port);
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

  startServer(port) {
    return new Promise((resolve) => {
      this.server = express();
      this.server.use(this.defaultMiddleware());
      this.server.use(this.router);
      this.server.use(this.errorMiddleware());
      this.server.listen(port, resolve);
    });
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
      router.use(forceSSL({ enable301Redirects: securityConfig.redirectToSSL }));
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
    let services = this.container.lookupType('services');
    return function errorHandler(err, req, res, next) {
      let errorAction = new ErrorAction({
        name: 'error',
        request: req,
        response: res,
        application,
        error: err,
        originalAction: req._originalAction,
        next,
        services,
      });
      errorAction.run();
    };
  },

  handlerForAction(actionPath) {
    let application = this;
    let Action = this.container.lookup('actions/' + actionPath);
    let services = this.container.lookupType('services');
    assert(Action, `You tried to map a route to the '${ actionPath }' action, but no such action was found!`);
    return function invokeActionForRoute(req, res, next) {
      req._originalAction = actionPath;
      let action = new Action({
        name: actionPath,
        request: req,
        response: res,
        application,
        next,
        services,
      });
      action.run();
    };
  }

});
