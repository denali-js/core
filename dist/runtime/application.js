'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _dagMap = require('dag-map');

var _dagMap2 = _interopRequireDefault(_dagMap);

var _engine = require('./engine');

var _engine2 = _interopRequireDefault(_engine);

var _container = require('./container');

var _container2 = _interopRequireDefault(_container);

var _blackburn = require('blackburn');

var _blackburn2 = _interopRequireDefault(_blackburn);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _merge = require('lodash/object/merge');

var _merge2 = _interopRequireDefault(_merge);

var _responseTime = require('response-time');

var _responseTime2 = _interopRequireDefault(_responseTime);

var _compression = require('compression');

var _compression2 = _interopRequireDefault(_compression);

var _cookieParser = require('cookie-parser');

var _cookieParser2 = _interopRequireDefault(_cookieParser);

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

var _helmet = require('helmet');

var _helmet2 = _interopRequireDefault(_helmet);

var _expressRequestId = require('express-request-id');

var _expressRequestId2 = _interopRequireDefault(_expressRequestId);

var _expressForceSsl = require('express-force-ssl');

var _expressForceSsl2 = _interopRequireDefault(_expressForceSsl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * Application instances are little more than specialized Engines, designed to
 * kick off the loading, mounting, and launching stages of booting up.
 *
 * @title Application
 */
exports.default = _engine2.default.extend({

  isApplication: true,

  init: function init() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    options.container = new _container2.default();
    options.container.addChildContainer(this._createDefaultContainer());
    this._super.apply(this, arguments);
    this.mount();
  },
  _createDefaultContainer: function _createDefaultContainer() {
    var defaultContainer = new _container2.default();
    defaultContainer.register('actions/error', require('./default-container/error-action'));
    return defaultContainer;
  },
  mount: function mount() {
    this.mountConfig();
    this.sortInitializers();
    this.mountEngineRouters();
  },
  mountConfig: function mountConfig() {
    var _this = this;

    this.config = this._config(this.environment);
    this.eachEngine(function (engine) {
      engine._config(_this.environment, _this.config);
    }, { childrenFirst: false });
  },
  sortInitializers: function sortInitializers() {
    var _this2 = this;

    var initializers = this._initializers;
    this.eachEngine(function (engine) {
      initializers.push.apply(initializers, _toConsumableArray(engine._initializers));
    });
    var initializerGraph = new _dagMap2.default();
    initializers.forEach(function (initializer) {
      initializerGraph.addEdges(initializer.name, initializer.initializer, initializer.before, initializer.after);
    });
    this.initializers = [];
    initializerGraph.topsort(function (_ref) {
      var value = _ref.value;

      _this2.initializers.push(value);
    });
  },
  mountEngineRouters: function mountEngineRouters() {
    var _this3 = this;

    this.eachEngine(function (engine) {
      var namespace = _this3._engineMounts[engine.name] || engine.defaultNamespace || '/';
      _this3.router.use(namespace, engine.router);
    });
  },
  start: function start() {
    var _this4 = this;

    var port = this.config.server.port;
    return this.runInitializers().then(function () {
      return _this4.startServer(port);
    }).then(function () {
      _this4.log('info', _this4.pkg.name + '@' + _this4.pkg.version + ' server up on port ' + port);
    }).catch(function (err) {
      _this4.log('error', 'Problem starting app ...');
      _this4.log('error', err.stack || err);
    });
  },
  runInitializers: function runInitializers() {
    var _this5 = this;

    return _bluebird2.default.resolve(this.initializers).each(function (initializer) {
      return initializer(_this5);
    });
  },
  startServer: function startServer(port) {
    var _this6 = this;

    return new _bluebird2.default(function (resolve) {
      _this6.server = (0, _express2.default)();
      _this6.server.use(_this6.defaultMiddleware());
      _this6.server.use(_this6.router);
      _this6.server.use(_this6.errorMiddleware());
      _this6.server.listen(port, resolve);
    });
  },
  defaultMiddleware: function defaultMiddleware() {
    var router = _express2.default.Router();
    router.use(this.errorMiddleware());
    router.use((0, _responseTime2.default)());
    router.use((0, _expressRequestId2.default)());
    router.use(this.loggerMiddleware());
    var securityConfig = this.config.security || {};
    router.use(_helmet2.default.csp({
      directives: (0, _merge2.default)({ reportUri: '/_report-csp-violations' }, securityConfig && securityConfig.csp),
      reportOnly: this.environment === 'development',
      disableAndroid: true
    }));
    if (this.environment === 'development') {
      router.post('/_report-csp-violations', function (req, res) {
        res.sendStatus(200);
      });
    }
    router.use(_helmet2.default.xssFilter());
    router.use(_helmet2.default.frameguard());
    router.use(_helmet2.default.hidePoweredBy());
    router.use(_helmet2.default.ieNoOpen());
    router.use(_helmet2.default.noSniff());
    router.use((0, _compression2.default)());
    router.use((0, _cors2.default)(securityConfig.cors));
    router.use((0, _cookieParser2.default)());
    router.use((0, _blackburn2.default)({
      adapters: this.container.lookupType('adapters'),
      serializers: this.container.lookupType('serializers')
    }));

    if (securityConfig.requireSSL) {
      router.use((0, _expressForceSsl2.default)({ enable301Redirects: securityConfig.redirectToSSL }));
    }

    return router;
  },
  loggerMiddleware: function loggerMiddleware() {
    var _this7 = this;

    var loggerFormats = {
      'development': 'dev',
      'production': 'combined'
    };
    return (0, _morgan2.default)(loggerFormats[this.environment] || 'dev', {
      skip: function skip() {
        return _this7.enviroment !== 'test';
      }
    });
  },
  errorMiddleware: function errorMiddleware() {
    var application = this;
    var ErrorAction = this.container.lookup('actions/error');
    var services = this.container.lookupType('services');
    return function errorHandler(err, req, res, next) {
      var errorAction = new ErrorAction({
        name: 'error',
        request: req,
        response: res,
        application: application,
        error: err,
        originalAction: req._originalAction,
        next: next,
        services: services
      });
      errorAction.run();
    };
  },
  handlerForAction: function handlerForAction(actionPath) {
    var application = this;
    var Action = this.container.lookup('actions/' + actionPath);
    var services = this.container.lookupType('services');
    (0, _assert2.default)(Action, 'You tried to map a route to the \'' + actionPath + '\' action, but no such action was found!');
    return function invokeActionForRoute(req, res, next) {
      req._originalAction = actionPath;
      var action = new Action({
        name: actionPath,
        request: req,
        response: res,
        application: application,
        next: next,
        services: services
      });
      action.run();
    };
  }
});
module.exports = exports['default'];