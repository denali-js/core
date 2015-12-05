import path from 'path';
import Application from './runtime/application';
import Error from './runtime/error';
import Controller from 'foraker';
import { Serializer, FlatSerializer, RootSerializer, JSONAPISerializer, Adapter, RawAdapter } from 'blackburn';
import { version } from '../../package.json';

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

export { Application, Controller, Adapter, RawAdapter, Serializer, JSONAPISerializer, FlatSerializer, RootSerializer, version, Error };

/**
 * Starts the server found at the specified directory. If no directory is given,
 * defaults to the current working directory.
 *
 * @method start
 *
 * @param  {String} applicationDir The root directory that contains the Denali
 * app. (Defaults to `process.cwd()`)
 */
export function start(applicationDir = process.cwd()) {
  let ApplicationClass = require(path.join(applicationDir, 'app/application'));
  let application = new ApplicationClass({ rootDir: applicationDir });
  return application.start();
}