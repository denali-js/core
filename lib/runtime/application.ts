import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
import { each, all } from 'bluebird';
import * as dotenv from 'dotenv';
import {
  values
} from 'lodash';
import Addon, { AddonOptions } from './addon';
import topsort from '../utils/topsort';
import Router from './router';
import Logger from './logger';
import Container from './container';
import discoverAddons from '../utils/discover-addons';
import tryRequire from '../utils/try-require';

interface ApplicationOptions {
  router?: Router;
  addons: string[];
  container?: Container;
  environment: string;
  dir: string;
  logger?: Logger;
  pkg?: any;
}

interface Initializer {
  name: string;
  initialize: (application: Application) => Promise<any>;
  before?: string | string[];
  after?: string | string[];
}

/**
 * Application instances are specialized Addons, designed to kick off the
 * loading, mounting, and launching stages of booting up.
 *
 * @export
 * @class Application
 * @extends {Addon}
 * @module denali
 * @submodule runtime
 */
export default class Application extends Addon {

  /**
   * The Router instance for this Application.
   *
   * @type {Router}
   */
  public router: Router;

  /**
   * The application config
   *
   * @type {*}
   */
  public config: any;

  /**
   * Creates an instance of Application. Note that the Application won't start immediately - you
   * must call `application.start()`
   *
   * @param {ApplicationOptions} options
   */
  constructor(options: ApplicationOptions) {
    if (!options.container) {
      options.container = new Container();
      options.logger = options.logger || new Logger();
      options.router = options.router || new Router({
        container: options.container,
        logger: options.logger
      });
      options.container.register('router:main', options.router);
      options.container.register('logger:main', options.logger);
    }
    super(<AddonOptions>options);
    this.container.register('application:main', this);
    this.router = this.container.lookup('router:main');
    this.logger = this.container.lookup('logger:main');
    this.addons = this.buildAddons(options.addons || []);
    // Generate config first, since the loading process may need it
    this.config = this.generateConfig();

    this.addons.forEach((addon) => {
      addon.load();
    });
    this.load();
    this.compileRouter();
  }

  /**
   * Given a directory that contains an addon, load that addon and instantiate
   * it's Addon class.
   *
   * @private
   * @param {string[]} preseededAddons
   * @returns {Addon[]}
   */
  private buildAddons(preseededAddons: string[]): Addon[] {
    return discoverAddons(this.dir, { preseededAddons }).map((dir) => {
      let pkg;
      let AddonClass;
      try {
        pkg = require(path.join(dir, 'package.json'));
        AddonClass = tryRequire(path.join(dir, 'app', 'addon.js'));
        AddonClass = AddonClass || Addon;
      } catch (e) {
        /* eslint-disable no-console */
        console.error(`Error loading an addon from ${ dir }:`);
        console.error(e);
        /* eslint-enable no-console */
        throw e;
      }
      AddonClass = <typeof Addon>(AddonClass.default || AddonClass);
      return new AddonClass({
        environment: this.environment,
        container: this.container,
        logger: this.logger,
        dir,
        pkg
      });
    });
  }

  /**
   * Take the loaded environment config functions, and execute them.
   * Application config is executed first, and the returned config object is
   * handed off to the addon config files, which add their configuration by
   * mutating that same object.
   *
   * The resulting final config is stored at `application.config`, and is
   * registered in the container under `config:environment`.
   *
   * @private
   * @returns {*}
   */
  private generateConfig(): any {
    dotenv.config({ silent: true });
    let config = this._config(this.environment);
    config.environment = this.environment;
    this.container.register('config:environment', config);
    this.addons.forEach((addon) => {
      addon._config(this.environment, config);
    });
    return config;
  }

  /**
   * Assemble middleware and routes
   *
   * @private
   */
  private compileRouter(): void {
    this.addons.forEach((addon) => {
      addon._middleware(this.router, this);
    });
    this._middleware(this.router, this);

    this._routes(this.router);
    this.addons.reverse().forEach((addon) => {
      addon._routes(this.router);
    });
  }

  /**
   * Start the Denali server. Runs all initializers, creates an HTTP server,
   * and binds to the port to handle incoming HTTP requests.
   *
   * @returns {Promise<void>}
   */
  public async start(): Promise<void> {
    let port = this.config.server.port || 3000;
    try {
      await this.runInitializers();
      if (!this.config.server.detached) {
        await this.createServer(port);
        this.logger.info(`${ this.pkg.name }@${ this.pkg.version } server up on port ${ port }`);
      }
    } catch (error) {
      this.logger.error('Problem starting app ...');
      this.logger.error(error.stack || error);
    }
  }

  /**
   * Creates an HTTP or HTTPS server, depending on whether or not SSL
   * configuration is present in config/environment.js
   *
   * @private
   * @param {number} port
   * @returns {Promise<{}>}
   */
  private createServer(port: number): Promise<{}> {
    return new Promise((resolve) => {
      // TODO create both http & https if redirect-to-ssl is enabled
      let handler = this.router.handle.bind(this.router);
      if (this.config.server.ssl) {
        https.createServer(this.config.server.ssl, handler).listen(port, resolve);
      } else {
        http.createServer(handler).listen(port, resolve);
      }
    });
  }

  /**
   * Lookup all initializers and run them in sequence. Initializers can
   * override the default load order by including `before` or `after`
   * properties on the exported class (the name or array of names of the other
   * initializers it should run before/after).
    *
    * @returns {Promise<void>}
    */
   async runInitializers(): Promise<void> {
    let initializers = <Initializer[]>topsort(values(this.container.lookupAll('initializer')));
    await each(initializers, (initializer: Initializer) => {
      initializer.initialize(this);
    });
  }

  /**
   * Shutdown the application gracefully (i.e. close external database connections, drain in-flight
   * requests, etc)
   *
   * @returns
   */
  // TODO drain requests from HTTP server
  async shutdown(): Promise<void> {
    await all(this.addons.map((addon) => addon.shutdown(this)));
  }

}
