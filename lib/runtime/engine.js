import path from 'path';
import CoreObject from 'core-object';
import DAG from 'dag-map';
import { tryRequire } from '../utils';
import forIn from 'lodash-node/modern/object/forIn';
import merge from 'lodash-node/modern/object/merge';
import contains from 'lodash-node/modern/collection/contains';
import values from 'lodash-node/modern/object/values';
import mapValues from 'lodash-node/modern/object/mapValues';
import requireAll from 'require-all';
import routerDSL from './router-dsl';

export default CoreObject.extend({

  /**
   * Create a new Engine
   *
   * @constructor
   *
   * @param  {Object} options
   * @param  {Object} options.rootDir  The root directory for this engine
   * @param  {Object} options.environment  The current environment, i.e. 'production'
   * @param  {Object} options.parent  If this is a child engine, the parent engine to this one
   *
   * @return {Engine}
   */
  init(options) {
    this._super.apply(this, arguments);

    this.env = options.environment || 'development';

    this.rootDir = options.rootDir;
    this.appDir = options.appDir || path.join(this.rootDir, 'app');
    this.configDir = options.configDir || path.join(this.rootDir, 'config');

    this.pkg = tryRequire(path.join(this.rootDir, 'package.json'));

    this.loadChildEngines();
    this.loadConfig();
    this.loadInitializers();
    this.loadMiddleware();
    this.loadRoutes();
    this.loadAdapters();
    this.loadControllers();
    this.loadJobs();
    this.loadSerializers();
  },

  loadChildEngines() {
    this.engines = [];
    let engineGraph = new DAG();
    forIn(this.pkg.dependencies, (version, pkgName) => {
      let root = path.join(this.rootDir, 'node_modules', pkgName);
      let pkg = require(path.join(root, 'package.json'));
      let config = pkg.denali || {};
      if (pkg.keywords && contains(pkg.keywords, 'denali-engine')) {
        let Engine = require(root);
        let engine = new Engine({
          rootDir: root,
          environment: this.env,
          parent: this
        });
        engineGraph.addEdges(pkg.name, engine, config.before, config.after);
      }
    });
    engineGraph.topsort(({ value }) => {
      this.engines.push(value);
    });
  },

  loadConfig() {
    this.config = {};
    let configs = requireAll(this.configDir, { filter: /\.json$/ });
    forIn(configs, (config, namespace) => {
      this.config[namespace] = config;
    });
  },

  loadInitializers() {
    let initializersDir = path.join(this.configDir, 'initializers');
    this.initializers = values(requireAll(initializersDir));
  },

  loadMiddleware() {
    this.middleware = require(path.join(this.configDir, 'middleware'));
  },

  loadAdapters() {
    this.adapters = requireAll(path.join(this.appDir, 'adapters'));
  },

  loadControllers() {
    this.controllers = requireAll(path.join(this.appDir, 'controllers'));
    // Instantiate the controllers
    this.controllers = mapValues(this.controllers, (C) => new C());
  },

  loadJobs() {
    this.jobs = requireAll(path.join(this.appDir, 'jobs'));
  },

  loadSerializers() {
    this.serializers = requireAll(path.join(this.appDir, 'serializers'));
  },

  loadRoutes() {
    this.routes = require(path.join(this.configDir, 'routes'));
  },

  mountConfig(application) {
    this.engines.forEach((engine) => {
      engine.mountConfig(application);
    });
    application.config = merge(application.config, this.config);
  },

  mountInitializers(application) {
    this.engines.forEach((engine) => {
      engine.mountInitializers(application);
    });
    application.initializers = application.initializers.concat(this.initializers);
  },

  mountMiddleware(application) {
    this.engines.forEach((engine) => {
      engine.mountMiddleware(application);
    });
    this.middleware(application.router, application);
  },

  mountAdapters(application) {
    this.engines.forEach((engine) => {
      engine.mountAdapters(application);
    });
    application.adapters = merge(application.adapters, this.adapters);
  },

  mountControllers(application) {
    this.engines.forEach((engine) => {
      engine.mountControllers(application);
    });
    application.controllers = merge(application.controllers, this.controllers);
  },

  mountJobs(application) {
    this.engines.forEach((engine) => {
      engine.mountJobs(application);
    });
    application.jobs = merge(application.jobs, this.jobs);
  },

  mountSerializers(application) {
    this.engines.forEach((engine) => {
      engine.mountSerializers(application);
    });
    application.serializers = merge(application.serializers, this.serializers);
  },

  mountRoutes(application) {
    this.engines.forEach((engine) => {
      engine.mountRoutes(application);
    });
    this.routes.call(routerDSL(application));
  }

});
