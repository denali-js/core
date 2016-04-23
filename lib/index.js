/**
 * This is the main module exported by Denali when it is loaded via
 * `require/import`.
 *
 * There are two things we export from this file:
 *
 * 1. Convenient shortcuts to other modules within Denali. Rather than having
 * to `import Addon from 'denali/dist/lib/runtime/addon'`, you can just
 * `import { Addon } from 'denali'`.
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
 * @module denali
 */

const DenaliObject = require('./runtime/object');
const inject = require('./runtime/inject');
const Factory = require('./runtime/factory');
const Application = require('./runtime/application');
const Addon = require('./runtime/addon');
const Errors = require('./runtime/errors');
const ErrorAction = require('./runtime/base/app/actions/error');
const Initializer = require('./runtime/initializer');
const Action = require('./runtime/action');
const Filter = require('./runtime/filter');
const Service = require('./runtime/service');
const Test = require('./test');
const { version } = require('../package.json');

const blackburn = require('blackburn');
const blackburnClasses = [ 'Serializer', 'FlatSerializer', 'RootSerializer', 'JSONAPISerializer', 'Adapter', 'RawAdapter' ];

blackburnClasses.forEach((Class) => {
  blackburn[Class].singleton = true;
  blackburn[Class].extend = DenaliObject.extend;
});

const Serializer = blackburn.Serializer;
const FlatSerializer = blackburn.FlatSerializer;
const RootSerializer = blackburn.RootSerializer;
const JSONAPISerializer = blackburn.JSONAPISerializer;
const Adapter = blackburn.Adapter;
const RawAdapter = blackburn.RawAdapter;

module.exports = {
  DenaliObject,
  inject,
  Factory,
  Application,
  Addon,
  Errors,
  ErrorAction,
  Initializer,
  Action,
  Filter,
  Service,
  Serializer,
  FlatSerializer,
  RootSerializer,
  JSONAPISerializer,
  Adapter,
  RawAdapter,
  Test,
  version
};
