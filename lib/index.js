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

import DenaliObject from './runtime/object';
import inject from './runtime/inject';
import Factory from './runtime/factory';
import Application from './runtime/application';
import Addon from './runtime/addon';
import Errors from './runtime/errors';
import ErrorAction from './runtime/base/app/actions/error';
import Initializer from './runtime/initializer';
import Action from './runtime/action';
import Filter from './runtime/filter';
import Service from './runtime/service';
import Test from './test';
import { version } from '../package.json';

// Flag blackburn re-exports as singletons
import * as blackburn from 'blackburn';
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

export {
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
