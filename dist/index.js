'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.version = exports.RawAdapter = exports.Adapter = exports.JSONAPISerializer = exports.RootSerializer = exports.FlatSerializer = exports.Serializer = exports.service = exports.Service = exports.Filter = exports.Action = exports.Errors = exports.Application = undefined;

var _application = require('./runtime/application');

var _application2 = _interopRequireDefault(_application);

var _errors = require('./runtime/errors');

var _errors2 = _interopRequireDefault(_errors);

var _action = require('./runtime/action');

var _action2 = _interopRequireDefault(_action);

var _filter = require('./runtime/filter');

var _filter2 = _interopRequireDefault(_filter);

var _service = require('./runtime/service');

var _service2 = _interopRequireDefault(_service);

var _service3 = require('./runtime/injections/service');

var _service4 = _interopRequireDefault(_service3);

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
exports.Errors = _errors2.default;
exports.Action = _action2.default;
exports.Filter = _filter2.default;
exports.Service = _service2.default;
exports.service = _service4.default;
exports.Serializer = _blackburn.Serializer;
exports.FlatSerializer = _blackburn.FlatSerializer;
exports.RootSerializer = _blackburn.RootSerializer;
exports.JSONAPISerializer = _blackburn.JSONAPISerializer;
exports.Adapter = _blackburn.Adapter;
exports.RawAdapter = _blackburn.RawAdapter;
exports.version = _package.version;