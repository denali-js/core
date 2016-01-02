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
import metaFor from './meta-for';

/**
 * Addons form the foundation of Denali, and are built with extensibility as a
 * first-class feature. They are responsible for coordinating the various other
 * libraries in the Denali framework, and act as the glue that holds
 * everything together.
 *
 * @title Addon
 */

export default DenaliObject.extend({

  /**
   * Create a new Addon. Upon creation, the Addon instance will search for any
   * child Addon's present, then load it's config, intializers, routing
   * information, and app classes (i.e. adapters, controllers, etc).
   *
   * @constructor
   *
   * @param  {Object} options
   * @param  {Object} options.dir  The root directory for this addon
   * @param  {Object} options.environment  The current environment, i.e. 'production'
   * @param  {Object} options.parent  If this is a child addon, the parent addon to this one
   *
   * @return {Addon}
   */
  init() {
    this._super(...arguments);
    assert(this.dir, 'You must supply a dir to an Addon instance');
    assert(this.environment, 'You must supply an environment to an Addon instance');

    this.appDir = path.join(this.dir, 'app');
    this.configDir = path.join(this.dir, 'config');
    this.pkg = tryRequire(path.join(this.dir, 'package.json'));
    this.name = this.pkg.name;

    this.router = this.router || express.Router();
    this._addonMounts = {};
    this.container = this.container || new Container();
    if (this.parent) {
      this.parent.container.addChildContainer(this.container);
    }

    this.discoverAddons();
    this.load();
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
    this._middleware = this.loadConfigFile('middleware');
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
   * Discovers any child addons present for this addon, and loads them.
   *
   * @method discoverAddons
   * @private
   */
  discoverAddons() {
    this.addonGraph = new DAG();
    forIn(this.pkg.dependencies, (version, pkgName) => {
      let pkgMainPath = resolve.sync(pkgName, { basedir: this.dir });
      let pkgPath = findup.sync(pkgMainPath, 'package.json');
      let pkgJSONPath = path.join(pkgPath, 'package.json');
      let pkg = require(pkgJSONPath);
      let isDenaliAddon = pkg.keywords && contains(pkg.keywords, 'denali-addon');

      if (isDenaliAddon) {
        let config = pkg.denali || {};

        let AddonClass;
        let customAddonClass = path.join(root, 'app', 'addon.js');
        if (fs.existsSync(customAddonClass)) {
          AddonClass = require(customAddonClass);
        } else {
          AddonClass = module.exports;
        }

        let addon = new AddonClass({
          dir: pkgPath,
          environment: this.environment,
          parent: this
        });
        this.addonGraph.addEdges(pkg.name, addon, config.before, config.after);
        this.container.addChildContainer(addon.container);
      }
    });
  },

  eachAddon(fn, options = {}) {
    let childrenFirst = options.childrenFirst;
    return this.addonGraph.topsort(({ value }) => {
      if (childrenFirst) {
        value.eachAddon(fn, options);
        fn(value);
      } else {
        fn(value);
        value.eachAddon(fn, options);
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

  toString() {
    return `<Addon:${ metaFor(this).id }>`;
  }

});
