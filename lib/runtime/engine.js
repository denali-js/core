import assert from 'assert';
import path from 'path';
import fs from 'fs';
import CoreObject from 'core-object';
import DAG from 'dag-map';
import { tryRequire } from '../utils';
import forIn from 'lodash/object/forIn';
import merge from 'lodash/object/merge';
import contains from 'lodash/collection/contains';
import values from 'lodash/object/values';
import mapValues from 'lodash/object/mapValues';
import forEach from 'lodash/collection/forEach';
import omit from 'lodash/object/omit';
import set from 'lodash/object/set';
import invoke from 'lodash/collection/invoke';
import requireAll from 'require-all';
import routerDSL from './router-dsl';

const NON_JSON_EXTENSION = /(.+)\.(?!json).+$/;
const JSON_EXTENSION = /(.+)\.json$/;

/**
 * Engines form the foundation of Denali, and are built with extensibility as a
 * first-class feature. They are responsible for coordinating the various other
 * libraries in the Denali framework, and act as the glue that holds
 * everything together.
 *
 * @title Engine
 */

export default CoreObject.extend({

  /**
   * Create a new Engine. Upon creation, the Engine instance will search for any
   * child Engine's present, then load it's config, intializers, routing
   * information, and app classes (i.e. adapters, controllers, etc).
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
  init(options = {}) {
    this._super.apply(this, arguments);
    assert(options.rootDir, 'You must supply a rootDir to an Engine instance');

    this.env = options.environment || 'development';
    this.port = options.port || 3000;

    this.rootDir = options.rootDir;
    this.appDir = options.appDir || path.join(this.rootDir, 'app');
    this.configDir = options.configDir || path.join(this.rootDir, 'config');

    this.pkg = tryRequire(path.join(this.rootDir, 'package.json'));

    this.discoverEngines();
  },

  /**
   * Discovers any child engines present for this engine, and loads them.
   *
   * @method discoverEngines
   * @private
   */
  discoverEngines() {
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

  load(application = this) {
    this.engines.forEach((engine) => { engine.load(application); });
    this.loadConfig(application);
    this.loadInitializers(application);
    this.loadApp(application);
    this.loadMiddleware(application);
    this.loadRoutes(application);
  },

/**
 * Loads the config files for this engine. Config files are JS or JSON files
 * found in the config directory (`config/` by default). Config files are
 * stored by topic. For example, your config folder might have a `files.js`
 * and `database.json`.
 *
 * JS files are expected to export a function that accepts the application
 * environment as it's first parameter (i.e. 'development'). JSON files should
 * have their contents namespaced under the appropriate environment (i.e. a
 * top level "development" key).
 *
 * So for example, the following `config/` directory:
 *
 * ```
 * config/
 *   foo.json
 *   bar.js
 * ```
 *
 * Would result in the following config object:
 *
 * ```js
 * {
 *   "foo": { ... contents of foo.json ... },
 *   "bar": { ... contents of bar('environment') ... }
 * }
 * ```
 *
 * Environment variables can also be used for configuration. They must be
 * prefixed with either 'DENALI_' or 'YOUR_APP_NAME_'. The environment variable
 * name will be treated as the config key, with `__` used to indicate nesting.
 * For example, `DENALI_DATABASE__HOST=example.com` would result in
 * `app.config.database.host = 'example.com'`.
 *
 * @method loadConfig
 *
 * @private
 *
 * @param {Application} application  the root application engine to mount to
 */
  loadConfig(application) {
    let executableConfigs = requireAll({
      dirname: this.configDir,
      filter: NON_JSON_EXTENSION,
      recursive: false
    });
    executableConfigs = omit(executableConfigs, 'routes', 'middleware');
    executableConfigs = invoke(executableConfigs, 'call', null, this.env);

    let jsonConfigs = requireAll({
      dirname: this.configDir,
      filter: JSON_EXTENSION,
      recursive: false
    });
    jsonConfigs = mapValues(jsonConfigs, this.env);

    this.config = this.config || {};
    merge(this.config, executableConfigs, jsonConfigs);

    forIn(process.env, (value, key) => {
      let isEngineConfig = key.indexOf(this.pkg.name.toUpperCase() + '_') === 0;
      let isApplicationConfig = key.indexOf(application.pkg.name.toUpperCase() + '_') === 0;
      let isDenaliConfig = key.indexOf('DENALI_') === 0;

      if (
        isEngineConfig && application !== this ||
        application === this && (isApplicationConfig || isDenaliConfig)
      ) {
        let normalizedKey = key.replace('__', '.').split('_').slice(1).join('_');
        set(this.config, normalizedKey, value);
      }
    });

    if (application !== this) {
      merge(application.config, this.config);
    }
  },

  /**
   * Initializer are run during Application startup, after the Application and
   * all it's child Engines are loaded, but before the HTTP server is started.
   *
   * Initializers are defined in `initializers/` inside the config directory.
   * Just add a file that exports a function, and it will be invoked during
   * startup.
   *
   * **Note:** for now, initializer order is _not_ guaranteed.
   *
   * @method loadInitializers
   * @private
   *
   * @param {Application} application  the root application engine to mount to
   */
  loadInitializers(application) {
    let initializersDir = path.join(this.configDir, 'initializers');
    this.initializers = values(requireAll(initializersDir));
    if (application !== this) {
      application.initializers = application.initializers.concat(this.initializers);
    }
  },

  /**
   * Under the hood, Denali apps use express to manage the HTTP server and
   * routing. The `config/middleware.js` file allows you to add middleware to
   * that express server that will execute before any of the Denali routing is
   * run.
   *
   * The `config/middleware.js` file should export a function that takes an
   * express 4 router as it's sole argument. You can then add any middleware
   * you'd like to that router.
   *
   * @method loadMiddleware
   * @private
   *
   * @param {Application} application  the root application engine to mount to
   */
  loadMiddleware(application) {
    this.middleware = require(path.join(this.configDir, 'middleware'));
    this.middleware(application.router, application);
  },

  /**
   * For each type of class in the app folder, load it and merge it into the
   * root application's registry
   *
   * @method loadApp
   * @private
   *
   * @param  {Application} application
   */
  loadApp(application) {
    [ 'adapters', 'controllers', 'jobs', 'serializers' ].forEach((type) => {
      let dir = path.join(this.appDir, type);
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        this[type] = requireAll({
          dirname: dir,
          recursive: false
        });
        if (application !== this) {
          merge(application[type], this[type]);
        }
      }
    });

    // Adapters, controllers, and serializers are singletons
    [ 'adapters', 'controllers', 'serializers' ].forEach((type) => {
      this[type] = mapValues(this[type], (Klass, name) => {
        return new Klass({ name });
      });
    });
    // Serializers need the other serializers as well
    forEach(this.serializers, (serializer) => {
      serializer.serializers = this.serializers;
    });
  },

  loadRoutes(application) {
    this.routes = require(path.join(this.configDir, 'routes'));
    this.routes.call(routerDSL(application));
  }

});
