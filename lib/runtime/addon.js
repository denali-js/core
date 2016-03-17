/**
 * @module denali
 * @submodule runtime
 */
import assert from 'assert';
import path from 'path';
import glob from 'glob';
import DenaliObject from './object';
import express from 'express';
import findup from 'findup';
import resolve from 'resolve';
import topsort from '../utils/topsort';
import eachDir from '../utils/each-dir';
import isDir from '../utils/is-dir';
import requireDir from '../utils/require-dir';
import tryRequire from '../utils/try-require';
import withoutExt from '../utils/without-ext';
import forIn from 'lodash/object/forIn';
import contains from 'lodash/collection/contains';
import forEach from 'lodash/collection/forEach';
import omit from 'lodash/object/omit';
import { singularize } from 'inflection';


/**
 * Addons are the fundamental unit of organization for Denali apps. The
 * Application class is just a specialized Addon, and each Addon can contain
 * any amount of functionality.
 *
 * ## Structure
 *
 * Addons are packaged as npm modules for easy sharing. When Denali boots up,
 * it searches your node_modules for available Denali Addons (identified by
 * the `denali-addon` keyword in the package.json). Addons can be nested (i.e.
 * an addon can itself depend on another addon).
 *
 * Each addon can be composed of one or several of the following parts:
 *
 *   * Config
 *   * Initializers
 *   * Middleware
 *   * App classes
 *   * Routes
 *
 * ## Load order
 *
 * After Denali discovers the available addons, it then merges them to form a
 * single application base. Addons higher in the dependency tree take
 * precedence, and sibling addons can specify load order via their package.json
 * files:
 *
 *     "denali": {
 *       "before": [ "another-addon-name" ],
 *       "after": [ "cool-addon-name" ]
 *     }
 *
 * @class Addon
 * @constructor
 * @extends Object
 * @private
 */
export default DenaliObject.extend({

  init() {
    this._super(...arguments);
    assert(this.environment, 'You must supply an environment to an Addon instance');

    this.appDir = path.join(this.dir, 'app');
    this.configDir = path.join(this.dir, 'config');
    this.pkg = tryRequire(path.join(this.dir, 'package.json'));
    this.name = (this.pkg && this.pkg.name) || 'anonymous-addon';
    this.router = express.Router();

    this.addons = this.discoverAddons();
    this._config = this.loadConfig();
  },

  /**
   * Search this addon's package.json dependencies for Denali addons. For each
   * discovered addon, instantiate it's Addon class, and add it to the addon
   * graph. Return the sorted addon graph.
   *
   * Note that this only returns top-level addons - nested addons are built
   * when the top-level addon is instantiated here.
   *
   * @method discoverAddons
   * @return {[Addon]} list of addons sorted by load order
   * @private
   */
  discoverAddons() {
    const addons = [];
    forIn(this.pkg.dependencies, (version, pkgName) => {
      const pkgMainPath = resolve.sync(pkgName, { basedir: this.dir });
      const pkgDir = findup.sync(pkgMainPath, 'package.json');
      const pkgJSONPath = path.join(pkgDir, 'package.json');

      const pkg = require(pkgJSONPath);
      const isDenaliAddon = pkg.keywords && contains(pkg.keywords, 'denali-addon');

      if (isDenaliAddon) {
        const loadOptions = pkg.denali || {};

        const AddonClass = tryRequire(path.join(pkgDir, 'app', 'addon.js')) || module.exports;
        const addon = new AddonClass({
          dir: pkgDir,
          environment: this.environment,
          parent: this,
          container: this.container
        });
        addons.push({
          name: pkg.name,
          value: addon,
          before: loadOptions.before,
          after: loadOptions.after
        });
      }
    });
    return topsort(addons, { valueKey: 'value' });
  },

  /**
 * Load the config for this addon. The standard `config/environment.js` file
 * is loaded by default. `config/middleware.js` and `config/routes.js` are
 * ignored. All other userland config files are loaded into the container
 * under their filenames.
 *
 * Config files are all .js files, so just the exported functions are loaded
 * here. The functions are run later, during application initialization, to
 * generate the actual runtime configuration.
 *
 * @method loadConfig
 *
 * @return {Object} the config/environment.js output
 *
 * @private
   */
  loadConfig() {
    const config = this.loadConfigFile('environment') || function() { return {}; };
    const allConfigFiles = requireDir(this.configDir, { recurse: false });
    const extraConfigFiles = omit(allConfigFiles, 'environment', 'middleware', 'routes');
    forEach(extraConfigFiles, (configModule, configFilename) => {
      const configModulename = withoutExt(configFilename);
      this.container.register('config:' + configModulename, configModule);
    });
    return config;
  },

  /**
   * Load the addon's various assets. Loads child addons first, meaning that
   * addon loading is depth-first recursive.
   *
   * @method load
   * @private
   */
  load() {
    this.addons.forEach((addon) => {
      addon.load();
    });
    this.loadInitializers();
    this.loadMiddleware();
    this.loadApp();
    this.loadRoutes();
  },

  /**
   * Load the initializers for this addon. Initializers live in
   * `config/initializers`.
   *
   * @method loadInitializers
   * @private
   */
  loadInitializers() {
    const initializersDir = path.join(this.configDir, 'initializers');
    if (isDir(initializersDir)) {
      const initializers = requireDir(initializersDir);
      forEach(initializers, (initializer, name) => {
        this.container.register('initializer:' + name, initializer);
      });
    }
  },

  /**
   * Load the middleware for this addon. Middleware is specified in
   * `config/middleware.js`. The file should export a function that accepts an
   * express router as it's single argument. You can then attach any middleware
   * you'd like to that router, and it will execute before any route handling
   * by Denali.
   *
   * Typically this is useful to register global middleware, i.e. a CORS
   * handler, cookie parser, etc.
   *
   * If you want to run some logic before certain routes only, try using Filters
   * instead.
   *
   * @method loadMiddleware
   * @private
   */
  loadMiddleware() {
    this._middleware = this.loadConfigFile('middleware') || function() {};
  },

  /**
   * Loads the routes for this addon. Routes are defined in `config/routes.js`.
   * The file should export a function that defines routes. See the RouterDSL
   * module for details on how to define routes.
   *
   * @method loadRoutes
   * @private
   */
  loadRoutes() {
    this._routes = this.loadConfigFile('routes') || function() {};
  },

  /**
   * Load the app assets for this addon. These are the various classes that live
   * under `app/`, including actions, adapters, filters, etc., as well as any
   * custom class types (i.e. models, roles).
   *
   * Files are loaded into the container under their folder's namespace, so
   * `app/roles/admin.js` would be registered as 'role:admin' in the container.
   * Deeply nested folders become part of the module name, i.e.
   * `app/roles/employees/manager.js` becomes 'role:employees/manager'.
   *
   * @method loadApp
   * @private
   */
  loadApp() {
    eachDir(this.appDir, (dirname) => {
      const dir = path.join(this.appDir, dirname);
      const type = singularize(dirname);
      glob.sync('**/*.js', { cwd: dir }).forEach((filepath) => {
        const modulepath = withoutExt(filepath);
        this.container.register(type + ':' + modulepath, require(path.join(dir, filepath)));
      });
    });
  },

  loadConfigFile(filename) {
    return tryRequire(path.join(this.configDir, filename + '.js'));
  }

});
