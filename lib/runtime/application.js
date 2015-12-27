import express from 'express';
import Promise from 'bluebird';
import DAG from 'dag-map';
import Engine from './engine';
import blackburn from 'blackburn';
import morgan from 'morgan';
import assign from 'lodash/object/assign';
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

  init() {
    this._super(...arguments);
    this.router = express.Router();
    this.mount();
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

  errorMiddleware() {
    let errorActionHandler = this.handlerForAction('error');
    return function handleError(req, res, next, err) {
      errorActionHandler(req, res, next, err);
    };
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

  handlerForAction(actionPath) {
    let Action = this.container.lookup('actions/' + actionPath);
    return function invokeActionForRoute(req, res, next) {
      let services = this.container.lookupType('services');
      let action = new Action(assign({}, services, {
        container: this.container,
        request: req,
        response: res,
        next
      }));
      action._run();
    };
  }

});
