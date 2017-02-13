import * as path from 'path';
import * as fs from 'fs-extra';
import * as glob from 'glob';
import findup = require('findup-sync');
import eachDir from '../utils/each-dir';
import { sync as isDirectory } from 'is-directory';
import requireDir from '../utils/require-dir';
import tryRequire from 'try-require';
import stripExtension from 'strip-extension';
import {
  forEach,
  omit
 } from 'lodash';
import { singularize } from 'inflection';
import * as createDebug from 'debug';
import DenaliObject from '../metal/object';
import Container from './container';
import Logger from './logger';
import Router from './router';
import Application from './application';

const debug = createDebug('denali:runtime:addon');

export interface AddonOptions {
  environment: string;
  dir: string;
  container: Container;
  logger: Logger;
  pkg?: any;
}

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
 * unified application. Addons higher in the dependency tree take precedence,
 * and sibling addons can specify load order via their package.json files:
 *
 *     "denali": {
 *       "before": [ "another-addon-name" ],
 *       "after": [ "cool-addon-name" ]
 *     }
 *
 * @export
 * @class Addon
 * @extends {DenaliObject}
 * @module denali
 * @submodule runtime
 */
export default class Addon extends DenaliObject {

  /**
   * The current environment for the app, i.e. 'development'
   *
   * @type {string}
   */
  public environment: string;

  /**
   * The root directory on the filesystem for this addon
   *
   * @type {string}
   */
  public dir: string;

  /**
   * The list of child addons that this addon contains
   *
   * @type {Addon[]}
   */
  public addons: Addon[];

  /**
   * @public
   * @type {Container}
   */
  public container: Container;

  /**
   * @protected
   * @type {Logger}
   */
  protected logger: Logger;

  /**
   * The package.json for this addon
   *
   * @protected
   * @type {*}
   */
  protected pkg: any;

  /**
   * Internal cache of the configuration that is specific to this addon
   *
   * @public
   * @type {*}
   */
  public _config: any;

  /**
   * Creates an instance of Addon.
   *
   * @param {AddonOptions} options
   */
  constructor(options: AddonOptions) {
    super();
    this.environment = options.environment;
    this.dir = options.dir;
    this.container = options.container;
    this.logger = options.logger;

    this.pkg = options.pkg || tryRequire(findup('package.json', { cwd: this.dir }));
    this.container.register(`addon:${ this.pkg.name }@${ this.pkg.version }`, this);
    this._config = this.loadConfig();
  }

  /**
   * The app directory for this addon. Override to customize where the app directory is stored in
   * your addon.
   *
   * @readonly
   * @type {string}
   */
  // TODO Rename to appDir
  get mainDir(): string {
    return path.join(this.dir, 'app');
  }

  /**
   * The config directory for this addon. Override this to customize where the config files are
   * stored in your addon.
   *
   * @readonly
   * @type {string}
   */
  public get configDir(): string {
    return path.join(this.dir, 'config');
  }

  /**
   * The name of the addon. Override this to use a different name than the package name for your
   * addon.
   *
   * @readonly
   * @type {string}
   */
  public get name(): string {
    return (this.pkg && this.pkg.name) || 'anonymous-addon';
  }

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
   * @protected
   * @returns {*}
   */
  protected loadConfig(): any {
    let config = this.loadConfigFile('environment') || function() {
      return {};
    };
    if (isDirectory(this.configDir)) {
      let allConfigFiles = requireDir(this.configDir, { recurse: false });
      let extraConfigFiles = omit(allConfigFiles, 'environment', 'middleware', 'routes');
      forEach(extraConfigFiles, (configModule, configFilename) => {
        let configModulename = stripExtension(configFilename);
        this.container.register(`config:${ configModulename }`, configModule);
      });
    }
    return config;
  }

  /**
   * Load the addon's various assets. Loads child addons first, meaning that
   * addon loading is depth-first recursive.
   *
   * @public
   */
  public load(): void {
    this.loadInitializers();
    this.loadMiddleware();
    this.loadApp();
    this.loadRoutes();
  }

  /**
   * Load the initializers for this addon. Initializers live in
   * `config/initializers`.
   *
   * @protected
   */
  protected loadInitializers(): void {
    let initializersDir = path.join(this.configDir, 'initializers');
    if (isDirectory(initializersDir)) {
      let initializers = requireDir(initializersDir);
      forEach(initializers, (initializer, name) => {
        this.container.register(`initializer:${ name }`, initializer);
      });
    }
  }

  /**
   * Load the middleware for this addon. Middleware is specified in
   * `config/middleware.js`. The file should export a function that accepts the
   * router as it's single argument. You can then attach any middleware you'd
   * like to that router, and it will execute before any route handling by
   * Denali.
   *
   * Typically this is useful to register global middleware, i.e. a CORS
   * handler, cookie parser, etc.
   *
   * If you want to run some logic before certain routes only, try using filters
   * on your actions instead.
   *
   * @protected
   */
  protected loadMiddleware(): void {
    this._middleware = this.loadConfigFile('middleware') || function() {};
  }

  /**
   * The middleware factory for this addon.
   *
   * @public
   */
  public _middleware: (router: Router, application: Application) => void;

  /**
   * Loads the routes for this addon. Routes are defined in `config/routes.js`.
   * The file should export a function that defines routes. See the Routing
   * guide for details on how to define routes.
   *
   * @protected
   */
  protected loadRoutes(): void {
    this._routes = this.loadConfigFile('routes') || function() {};
  }

  /**
   * The routes factory for this addon.
   *
   * @public
   */
  public _routes: (router: Router) => void;

  /**
   * Load the app assets for this addon. These are the various classes that live
   * under `app/`, including actions, models, etc., as well as any custom class
   * types.
   *
   * Files are loaded into the container under their folder's namespace, so
   * `app/roles/admin.js` would be registered as 'role:admin' in the container.
   * Deeply nested folders become part of the module name, i.e.
   * `app/roles/employees/manager.js` becomes 'role:employees/manager'.
   *
   * Non-JS files are loaded as well, and their container names include the
   * extension, so `app/mailer/welcome.html` becomes `mail:welcome.html`.
   *
   * @protected
   */
  protected loadApp(): void {
    debug(`loading app for ${ this.pkg.name }`);
    if (fs.existsSync(this.mainDir)) {
      eachDir(this.mainDir, (dirname) => {
        debug(`loading ${ dirname } for ${ this.pkg.name }`);
        let dir = path.join(this.mainDir, dirname);
        let type = singularize(dirname);

        glob.sync('**/*', { cwd: dir }).forEach((filepath) => {
          let modulepath = stripExtension(filepath);
          if (filepath.endsWith('.js')) {
            let Class = require(path.join(dir, filepath));
            Class = Class.default || Class;
            this.container.register(`${ type }:${ modulepath }`, Class);
          } else if (filepath.endsWith('.json')) {
            let mod = require(path.join(dir, filepath));
            this.container.register(`${ type }:${ modulepath }`, mod.default || mod);
          }
        });
      });
    }
  }

  /**
   * Helper to load a file from the config directory
   *
   * @protected
   * @param {string} filename
   * @returns {*}
   */
  protected loadConfigFile(filename: string): any {
    let configModule = tryRequire(path.join(this.configDir, `${ filename }.js`));
    return configModule && (configModule.default || configModule);
  }

  /**
   * A hook to perform any shutdown actions necessary to gracefully exit the application, i.e.
   * close database/socket connections.
   *
   * @param {Application} application
   */
  shutdown(application: Application):void {}

}
