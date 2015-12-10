'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _coreObject = require('core-object');

var _coreObject2 = _interopRequireDefault(_coreObject);

var _dagMap = require('dag-map');

var _dagMap2 = _interopRequireDefault(_dagMap);

var _utils = require('../utils');

var _forIn = require('lodash/object/forIn');

var _forIn2 = _interopRequireDefault(_forIn);

var _merge = require('lodash/object/merge');

var _merge2 = _interopRequireDefault(_merge);

var _contains = require('lodash/collection/contains');

var _contains2 = _interopRequireDefault(_contains);

var _values = require('lodash/object/values');

var _values2 = _interopRequireDefault(_values);

var _mapValues = require('lodash/object/mapValues');

var _mapValues2 = _interopRequireDefault(_mapValues);

var _forEach = require('lodash/collection/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _omit = require('lodash/object/omit');

var _omit2 = _interopRequireDefault(_omit);

var _set = require('lodash/object/set');

var _set2 = _interopRequireDefault(_set);

var _invoke = require('lodash/collection/invoke');

var _invoke2 = _interopRequireDefault(_invoke);

var _requireAll = require('require-all');

var _requireAll2 = _interopRequireDefault(_requireAll);

var _routerDsl = require('./router-dsl');

var _routerDsl2 = _interopRequireDefault(_routerDsl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var NON_JSON_EXTENSION = /(.+)\.(?!json).+$/;
var JSON_EXTENSION = /(.+)\.json$/;

/**
 * Engines form the foundation of Denali, and are built with extensibility as a
 * first-class feature. They are responsible for coordinating the various other
 * libraries in the Denali framework, and act as the glue that holds
 * everything together.
 *
 * @title Engine
 */

exports.default = _coreObject2.default.extend({

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

  init: function init() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    this._super.apply(this, arguments);
    (0, _assert2.default)(options.rootDir, 'You must supply a rootDir to an Engine instance');

    this.env = options.environment || 'development';
    this.port = options.port || 3000;

    this.rootDir = options.rootDir;
    this.appDir = options.appDir || _path2.default.join(this.rootDir, 'app');
    this.configDir = options.configDir || _path2.default.join(this.rootDir, 'config');

    this.pkg = (0, _utils.tryRequire)(_path2.default.join(this.rootDir, 'package.json'));

    this.discoverEngines();
  },

  /**
   * Discovers any child engines present for this engine, and loads them.
   *
   * @method discoverEngines
   * @private
   */
  discoverEngines: function discoverEngines() {
    var _this = this;

    this.engines = [];
    var engineGraph = new _dagMap2.default();
    (0, _forIn2.default)(this.pkg.dependencies, function (version, pkgName) {
      var root = _path2.default.join(_this.rootDir, 'node_modules', pkgName);
      var pkg = require(_path2.default.join(root, 'package.json'));
      var config = pkg.denali || {};
      if (pkg.keywords && (0, _contains2.default)(pkg.keywords, 'denali-engine')) {
        var Engine = require(root);
        var engine = new Engine({
          rootDir: root,
          environment: _this.env,
          parent: _this
        });
        engineGraph.addEdges(pkg.name, engine, config.before, config.after);
      }
    });
    engineGraph.topsort(function (_ref) {
      var value = _ref.value;

      _this.engines.push(value);
    });
  },
  load: function load() {
    var application = arguments.length <= 0 || arguments[0] === undefined ? this : arguments[0];

    this.engines.forEach(function (engine) {
      engine.load(application);
    });
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
  loadConfig: function loadConfig(application) {
    var _this2 = this;

    var executableConfigs = (0, _requireAll2.default)({
      dirname: this.configDir,
      filter: NON_JSON_EXTENSION,
      recursive: false
    });
    executableConfigs = (0, _omit2.default)(executableConfigs, 'routes', 'middleware');
    executableConfigs = (0, _invoke2.default)(executableConfigs, 'call', null, this.env);

    var jsonConfigs = (0, _requireAll2.default)({
      dirname: this.configDir,
      filter: JSON_EXTENSION,
      recursive: false
    });
    jsonConfigs = (0, _mapValues2.default)(jsonConfigs, this.env);

    this.config = this.config || {};
    (0, _merge2.default)(this.config, executableConfigs, jsonConfigs);

    (0, _forIn2.default)(process.env, function (value, key) {
      var isEngineConfig = key.indexOf(_this2.pkg.name.toUpperCase() + '_') === 0;
      var isApplicationConfig = key.indexOf(application.pkg.name.toUpperCase() + '_') === 0;
      var isDenaliConfig = key.indexOf('DENALI_') === 0;

      if (isEngineConfig && application !== _this2 || application === _this2 && (isApplicationConfig || isDenaliConfig)) {
        var normalizedKey = key.replace('__', '.').split('_').slice(1).join('_');
        (0, _set2.default)(_this2.config, normalizedKey, value);
      }
    });

    if (application !== this) {
      (0, _merge2.default)(application.config, this.config);
    } else {
      // Make the config statically available on the class itself for any
      // lib code that needs it statically. Since this code runs before any
      // initializers, it effectively ensures that the user can import their
      // application class statically (i.e. `import App from '../app'`) and
      // access the config.
      application.constructor.config = application.config;
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
  loadInitializers: function loadInitializers(application) {
    var initializersDir = _path2.default.join(this.configDir, 'initializers');
    this.initializers = (0, _values2.default)((0, _requireAll2.default)({
      dirname: initializersDir,
      resolve: function resolve(initializerModule) {
        return initializerModule.default || initializerModule;
      }
    }));
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
  loadMiddleware: function loadMiddleware(application) {
    var middleware = require(_path2.default.join(this.configDir, 'middleware'));
    this.middleware = middleware.default || middleware;
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
  loadApp: function loadApp(application) {
    var _this3 = this;

    ['adapters', 'controllers', 'jobs', 'serializers'].forEach(function (type) {
      var dir = _path2.default.join(_this3.appDir, type);
      if (_fs2.default.existsSync(dir) && _fs2.default.statSync(dir).isDirectory()) {
        _this3[type] = (0, _requireAll2.default)({
          dirname: dir,
          recursive: false
        });
        if (application !== _this3) {
          (0, _merge2.default)(application[type], _this3[type]);
        }
      }
    });

    // Adapters, controllers, and serializers are singletons
    ['adapters', 'controllers', 'serializers'].forEach(function (type) {
      _this3[type] = (0, _mapValues2.default)(_this3[type], function (classModule, name) {
        var Klass = classModule.default;
        return new Klass({ name: name });
      });
    });
    // Serializers need the other serializers as well
    (0, _forEach2.default)(this.serializers, function (serializer) {
      serializer.serializers = _this3.serializers;
    });
  },
  loadRoutes: function loadRoutes(application) {
    var routes = require(_path2.default.join(this.configDir, 'routes'));
    this.routes = routes.default || routes;
    this.routes.call((0, _routerDsl2.default)(application));
  }
});