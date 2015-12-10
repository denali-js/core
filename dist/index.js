'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Error = exports.version = exports.RootSerializer = exports.FlatSerializer = exports.JSONAPISerializer = exports.Serializer = exports.RawAdapter = exports.Adapter = exports.Controller = exports.Application = undefined;
exports.start = start;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _application = require('./runtime/application');

var _application2 = _interopRequireDefault(_application);

var _error = require('./runtime/error');

var _error2 = _interopRequireDefault(_error);

var _foraker = require('foraker');

var _foraker2 = _interopRequireDefault(_foraker);

var _blackburn = require('blackburn');

var _package = require('../package.json');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * This is the main module exported by Denali when it is loaded via
 * `require/import`.
 *
 * There are two things we export from this file:
 *
 * 1. Convenient shortcuts to other modules within Denali. Rather than having
 * to `import Engine from 'denali/dist/lib/runtime/engine'`, you can just
 * `import { Engine } from 'denali'`.
 *
 * 2. External modules that are part of the Denali framework. The big ones are
 * **foraker** and **blackburn**, responsible for providing controllers and a
 * serializer library, respectively. By having users import those modules
 * through Denali, we retain the ability to tweak or patch them in the future
 * as needed, and keep a unified experience for users who don't care about
 * Denali's internal architecture.
 *
 * ## Exports
 *
 * ### `Controller`
 *
 * The [foraker](https://github.com/davewasmer/foraker) Controller class.
 * Controllers are responsible for responding to requests to the Denali app.
 * Check out the [guides](controllers) or
 * [foraker](http://davewasmer.github.io/foraker) docs for details.
 *
 * ### `Serializer`
 *
 * The [blackburn](https://github.com/davewasmer/blackburn) Serializer class.
 * Serializers are responsible for determing what data gets sent over the
 * wire, and how that data is rendered into a JSON response. Check out the
 * [guides](serializers) or [blackburn](http://davewasmer.github.io/blackburn)
 * docs for details.
 *
 * ### `Errors`
 *
 * An errors module based on
 * [http-errors](https://github.com/jshttp/http-errors). Useful for
 * standardizing how you handle error responses. Check out the [guides](errors)
 * or the [http-errors docs](https://github.com/jshttp/http-errors) for details.
 *
 * @title Denali
 */

exports.Application = _application2.default;
exports.Controller = _foraker2.default;
exports.Adapter = _blackburn.Adapter;
exports.RawAdapter = _blackburn.RawAdapter;
exports.Serializer = _blackburn.Serializer;
exports.JSONAPISerializer = _blackburn.JSONAPISerializer;
exports.FlatSerializer = _blackburn.FlatSerializer;
exports.RootSerializer = _blackburn.RootSerializer;
exports.version = _package.version;
exports.Error = _error2.default;

/**
 * Starts the server found at the specified directory. If no directory is given,
 * defaults to the current working directory.
 *
 * @method start
 *
 * @param  {String} applicationDir The root directory that contains the Denali
 * app. (Defaults to `process.cwd()`)
 */

function start() {
  var applicationDir = arguments.length <= 0 || arguments[0] === undefined ? process.cwd() : arguments[0];

  var ApplicationClass = require(_path2.default.join(applicationDir, 'app/application')).default;
  var application = new ApplicationClass({ rootDir: applicationDir });
  return application.start();
}