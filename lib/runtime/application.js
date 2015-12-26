import express from 'express';
import Promise from 'bluebird';
import { log } from '../utils';
import DAG from 'dag-map';
import routerDSL from 'router-dsl';
import Engine from './engine';
import blackburn from 'blackburn';
import assign from 'lodash/object/assign';

import timing from 'response-time';
import compression from 'compression';
import cookies from 'cookie-parser';
import cors from 'cors';
import requestid from 'express-request-id';
import forceSSL from 'express-force-ssl';
import errorhandler from 'errorhandler';

/**
 * Application instances are little more than specialized Engines, designed to
 * kick off the loading, mounting, and launching stages of booting up.
 *
 * @title Application
 */
export default Engine.extend({

  init() {
    this._super(...arguments);
    this.router = express.Router();
    this.mount();
  },

  mount() {
    this.mountConfig();
    this.mountInitializers();
    this.mountMiddleware();
    this.mountRoutes();
    this.injectServices();
  },

  mountConfig() {
    this.config = this._config(this.environment);
    this.eachEngine((engine) => {
      engine._config(this.environment, this.config);
    }, { childrenFirst: false });
  },

  mountInitializers() {
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

  mountMiddleware() {
    this._middleware(this.router, this);
    this.eachEngine((engine) => {
      engine._middleware(this.router, this);
    });
  },

  mountRoutes() {
    this._routes.call(routerDSL);
    this.eachEngine((engine) => {
      engine._routes.call(routerDSL);
    });
  },

  start() {
    let port = this.config.server.port;
    return this.runInitializers()
      .then(() => {
        return this.startServer(port);
      }).then(() => {
        this.log(`${ this.pkg.name }@${ this.pkg.version } server up on port ${ port }`);
      }).catch(() => {
        this.log('Problem starting app ...');
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
    router.use(errorhandler(this));
    router.use(timing());
    router.use(requestid());
    router.use(this.loggerMiddleware());
    router.use(compression());
    router.use(cors(this.config.security.cors));
    router.use(cookies());
    router.use(blackburn({
      adapters: this.container.lookupType('adapters'),
      serializers: this.container.lookupType('serializers')
    }));

    if (this.config.security.requireSSL) {
      router.use(forceSSL({ enable301Redirects: this.config.security.redirectToSSL }));
    }

    return router;
  },

  log(level) {
    if (this.environment !== 'test' || level === 'error') {
      log.apply(this, arguments);
    }
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
