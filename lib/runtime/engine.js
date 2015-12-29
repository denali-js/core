import assert from 'assert';
import path from 'path';
import fs from 'fs';
import DenaliObject from './object';
import DAG from 'dag-map';
import express from 'express';
import findup from 'findup';
import resolve from 'resolve';
import routerDSL from './router-dsl';
import Container from './container';
import log from '../utils/log';
import eachDir from '../utils/each-dir';
import requireDir from '../utils/require-dir';
import tryRequire from '../utils/try-require';
import forIn from 'lodash/object/forIn';
import contains from 'lodash/collection/contains';
import values from 'lodash/object/values';

/**
 * Engines form the foundation of Denali, and are built with extensibility as a
 * first-class feature. They are responsible for coordinating the various other
 * libraries in the Denali framework, and act as the glue that holds
 * everything together.
 *
 * @title Engine
 */

export default DenaliObject.extend({

  /**
   * Create a new Engine. Upon creation, the Engine instance will search for any
   * child Engine's present, then load it's config, intializers, routing
   * information, and app classes (i.e. adapters, controllers, etc).
   *
   * @constructor
   *
   * @param  {Object} options
   * @param  {Object} options.dir  The root directory for this engine
   * @param  {Object} options.environment  The current environment, i.e. 'production'
   * @param  {Object} options.parent  If this is a child engine, the parent engine to this one
   *
   * @return {Engine}
   */
  init() {
    this._super(...arguments);
    assert(this.dir, 'You must supply a dir to an Engine instance');
    assert(this.environment, 'You must supply an environment to an Engine instance');

    this.appDir = path.join(this.dir, 'app');
    this.configDir = path.join(this.dir, 'config');
    this.pkg = tryRequire(path.join(this.dir, 'package.json'));
    this.name = this.pkg.name;

    this.router = express.Router();
    this._engineMounts = {};
    this.container = this.container || new Container();
    if (this.parent) {
      this.parent.container.addChildContainer(this.container);
    }

    this.load();
    this.discoverEngines();
  },

  load() {
    this.loadConfig();
    this.loadInitializers();
    this.loadMiddleware();
    this.loadApp();
    this.loadRoutes();
  },

  loadConfig() {
    this._config = this.loadConfigFile('environment');
  },

  loadInitializers() {
    let initializersDir = path.join(this.configDir, 'initializers');
    this._initializers = values(requireDir(initializersDir));
  },

  loadMiddleware() {
    this._middleware = this.loadConfigFile('environment');
    this._middleware(this.router);
  },

  loadRoutes() {
    this._routes = this.loadConfigFile('routes');
    this._routes.call(routerDSL(this));
  },

  loadApp() {
    eachDir(this.appDir, (dir) => {
      this.container.registerDir(path.join(this.appDir, dir), dir);
    });
  },

  /**
   * Discovers any child engines present for this engine, and loads them.
   *
   * @method discoverEngines
   * @private
   */
  discoverEngines() {
    this.engineGraph = new DAG();
    forIn(this.pkg.dependencies, (version, pkgName) => {
      let pkgMainPath = resolve.sync(pkgName, { basedir: this.dir });
      let pkgPath = findup.sync(pkgMainPath, 'package.json');
      let pkgJSONPath = path.join(pkgPath, 'package.json');
      let pkg = require(pkgJSONPath);
      let isDenaliEngine = pkg.keywords && contains(pkg.keywords, 'denali-engine');

      if (isDenaliEngine) {
        let config = pkg.denali || {};

        let EngineClass;
        let customEngineClass = path.join(root, 'app', 'engine.js');
        if (fs.existsSync(customEngineClass)) {
          EngineClass = require(customEngineClass);
        } else {
          EngineClass = module.exports;
        }

        let engine = new EngineClass({
          dir: pkgPath,
          environment: this.environment,
          parent: this
        });
        this.engineGraph.addEdges(pkg.name, engine, config.before, config.after);
      }
    });
  },

  eachEngine(fn, options = {}) {
    let childrenFirst = options.childrenFirst;
    return this.engineGraph.topsort(({ value }) => {
      if (childrenFirst) {
        value.eachEngine(fn, options);
        fn(value);
      } else {
        fn(value);
        value.eachEngine(fn, options);
      }
    });
  },

  loadConfigFile(filename) {
    return require(path.join(this.configDir, filename + '.js'));
  },

  log(level, ...msg) {
    if (this.environment !== 'test' || level === 'error') {
      if (!this.isApplication) {
        msg.unshift(`[${ this.name }]`);
      }
      log.call(this, level, ...msg);
    }
  },

});
