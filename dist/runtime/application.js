'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _utils = require('../utils');

var _error = require('./error');

var _error2 = _interopRequireDefault(_error);

var _engine = require('./engine');

var _engine2 = _interopRequireDefault(_engine);

var _blackburn = require('blackburn');

var _blackburn2 = _interopRequireDefault(_blackburn);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Application instances are little more than specialized Engines, designed to
 * kick off the loading, mounting, and launching stages of booting up.
 *
 * @title Application
 */
exports.default = _engine2.default.extend({

  /**
   * There are three stages involved when booting up a Denali application:
   *
   * 1. **load stage** - the application loads it's configuration and code from
   * the filesystem. It also discovers any child engines present, and triggers
   * the same for them.
   *
   * 2. **mount stage** - the application assembles a unified picture of itself
   * based on it's own code and config, as well as those of the child engines it
   * discovered during the load stage.
   *
   * 3. **launch** - now that the application has merged in the child engines,
   * it is ready to launch the HTTP server, connect to a port, and begin
   * accepting connections.
   *
   * When you instantiate a new Application instances, the first two stages run
   * immediately. However, the application does not launch until you run the
   * `start()` method. This is useful if you want to load an Application into
   * memory to inspect or use, but without booting up the actual HTTP server.
   *
   * @constructor
   */

  init: function init(options) {
    options.environment = options.environment || process.env.DENALI_ENV || process.env.NODE_ENV || 'development';
    this._super.call(this, options);
    this.router = new _express2.default.Router();
  },

  /**
   * Launch this Application. Runs the initializers, then boots up the HTTP
   * server and binds to a port. Returns a Promise which resolves once the
   * server is live and accepting connections.
   *
   * @method start
   *
   * @return {Promise} resolves when the server has successfully bound to it's
   * port and is accepting connections
   */
  start: function start() {
    var _this = this;

    this.load();

    return _bluebird2.default.resolve(this.initializers).each(function (initializer) {
      return initializer(_this);
    }).then(function () {
      return _this.launchServer();
    });
  },

  /**
   * Boots up the express HTTP server, mounts the Application's router to it,
   * and binds the server to the Application's port.
   *
   * @method launchServer
   * @private
   *
   * @return {Promise} resolves when the server has successfully bound to it's
   * port and is accepting connections
   */
  launchServer: function launchServer() {
    var _this2 = this;

    return new _bluebird2.default(function (resolve) {
      _this2.server = (0, _express2.default)();
      _this2.injectBlackburnPlusForaker(_this2.server);
      _this2.server.use(_this2.router);
      _this2.server.use(_this2.handleErrors.bind(_this2));
      _this2.server.listen(_this2.port, resolve);
    }).then(function () {
      _this2.log(_this2.pkg.name + '@' + _this2.pkg.version + ' server up on port ' + _this2.port);
    });
  },

  /**
   * A simple proxy for the utils/log module, which silences any logs if we are
   * currently testing
   *
   * @method log
   */
  log: function log(level) {
    if (this.env !== 'test' || level === 'error') {
      _utils.log.apply(this, arguments);
    }
  },

  /*eslint-disable no-unused-vars*/
  handleErrors: function handleErrors(err, req, res, next) {
    if (!res._rendered) {
      if (!err.status) {
        err = new _error2.default.InternalServerError(err.stack);
        this.log('error', err.stack);
      }
      err.code = err.code || err.name;
      return res.render(err);
    }
  },

  /*eslint-enable no-unused-vars*/

  injectBlackburnPlusForaker: function injectBlackburnPlusForaker(server) {
    // Setup vanilla blackburn installation
    server.use((0, _blackburn2.default)({
      adapters: this.adapters,
      serializers: this.serializers
    }));
    // Now wrap blackburn's render method with one which picks the corresponding
    // serializer for that controller. This is the glue that joins the blackburn
    // serialization with foraker's controllers.
    server.use(function (req, res, next) {
      // This controller property is injected into the context below, in the
      // handle method
      var render = res.render;
      res.render = function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        // We need to identify options arg, which can be second or third.
        // It's only second when no status is supplied. It can be omitted as
        // well, so if it is, default it to an empty object.
        var options = undefined;
        if (typeof args[0] !== 'number' && !args[2]) {
          options = args[1] = args[1] || {};
        } else {
          options = args[2] = args[2] || {};
        }

        var controller = req.context && req.context.controller;
        options.serializer = options.serializer || controller && controller.serializer || controller && controller.name;
        options.adapter = options.adapter || controller && controller.adapter || controller && controller.name;
        return render.apply(res, args);
      };
      next();
    });
  },

  /**
   * Takes a controllerAction string and returns an express-compatible route
   * handler function that will route the request to that controller and action.
   * This is defined only on the Application since there is only one server
   * shared across all the Engines.
   *
   * @method handle
   * @private
   *
   * @param  {String} controllerAction  a string indicating the controller and
   * action that should be routed to. For example, `'books.create'` would route
   * to the `BooksController` `create` action.
   *
   * @return {Function} an express-compatible route handler function
   */
  handle: function handle(controllerAction) {
    var _controllerAction$spl = controllerAction.split('.');

    var _controllerAction$spl2 = _slicedToArray(_controllerAction$spl, 2);

    var controllerName = _controllerAction$spl2[0];
    var actionName = _controllerAction$spl2[1];

    var controller = this.controllers[controllerName];
    (0, _assert2.default)(controller, 'Attempted to route to ' + controllerAction + ', but ' + controllerName + ' controller not found.');
    var action = controller.action(actionName);
    return function (req, res, next) {
      // Inject the controller into the incoming request (it's context object).
      var context = req.context = req.context || {};
      context.controller = context.controller || controller;
      action(req, res, next);
    };
  }
});