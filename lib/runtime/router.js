/**
 * @module denali
 * @submodule runtime
 */
import ware from 'ware';
import { pluralize } from 'inflection';
import Errors from './errors';
import Route from 'route-parser';
import Request from './request';
import ensureArray from '../utils/ensure-array';

export default class Router {

  routes = {
    get: [],
    post: [],
    put: [],
    patch: [],
    delete: [],
    head: [],
    options: []
  };
  middleware = ware();

  constructor(container) {
    this.container = container;
  }

  map(fn) {
    fn(this);
  }

  handle(req, response) {
    let request = new Request(req);
    let routes = this.routes[request.method];
    for (let i = 0; i <= routes.length; i++) {
      request.params = routes[i].match(request.path);
      if (request.params) {
        request.route = routes[i];
        break;
      }
    }
    if (!request.route) {
      return this.handleError(request, response, new Errors.NotFound());
    }

    this.middleware.run(request, response, (error) => {
      if (error) {
        return this.handleError(request, response, error);
      }

      let action = new request.route.action({
        request,
        response,
        container: this.container
      });

      let serializer = action.serializer || this.container.lookup('serializer:application');
      if (serializer && serializer.parse) {
        request.body = serializer.parse(request.body);
      }
      action.run().catch((uncaughtError) => {
        this.handleError(request, response, uncaughtError);
      });
    });
  }

  handleError(request, response, error) {
    let ErrorAction = this.container.lookup('action:error');
    let errorAction = new ErrorAction({
      request,
      response,
      error,
      container: this.container
    });
    errorAction.run();
  }

  use(middleware) {
    this.middleware.use(middleware);
  }

  route(method, pattern, actionPath) {
    let route = new Route(pattern);
    route.actionPath = actionPath;
    route.action = this.container.lookup(`action:${ actionPath }`);
    if (!route.action) {
      throw new Error(`No action found at ${ actionPath }`);
    }
    this.routes[method].push(route);
  }

  get(...args) { this.route('get', ...args); }
  post(...args) { this.route('post', ...args); }
  put(...args) { this.route('put', ...args); }
  patch(...args) { this.route('patch', ...args); }
  delete(...args) { this.route('delete', ...args); }

  // Resource routes
  resource(resourceName, options = {}) {
    let plural = pluralize(resourceName);

    let collection = `/${ plural }`;
    let resource = `${ collection }/:id`;
    let relationship = `${ resource }/relationships/:relation`;
    let related = `${ resource }/:relation`;

    if (options.related === false) {
      options.except = [ 'related', 'fetch-related', 'replace-related', 'add-related', 'remove-related' ].concat(options.except);
    }

    let hasWhitelist = Boolean(options.only);
    options.only = ensureArray(options.only);
    options.except = ensureArray(options.except);

    function include(action) {
      let whitelisted = options.only.includes(action);
      let blacklisted = options.except.includes(action);
      return !blacklisted && (
        hasWhitelist && whitelisted ||
        !hasWhitelist
      );
    }

    [
      [ 'list', 'get', collection ],
      [ 'create', 'post', collection ],
      [ 'show', 'get', resource ],
      [ 'update', 'patch', resource ],
      [ 'destroy', 'delete', resource ],
      [ 'related', 'get', related ],
      [ 'fetch-related', 'get', relationship ],
      [ 'replace-related', 'patch', relationship ],
      [ 'add-related', 'post', relationship ],
      [ 'remove-related', 'delete', relationship ]
    ].forEach(([ action, method, url ]) => {
      if (include(action)) {
        this[method](url, `${ plural }/${ action }`);
      }
    });
  }

  namespace(namespace, fn) {
    let router = this;
    if (namespace.endsWith('/')) {
      namespace = namespace.slice(0, namespace.length - 1);
    }
    let wrapper = {
      get(pattern, actionPath) { router.route('get', `${ namespace }/${ pattern }`, actionPath); },
      post(pattern, actionPath) { router.route('post', `${ namespace }/${ pattern }`, actionPath); },
      put(pattern, actionPath) { router.route('put', `${ namespace }/${ pattern }`, actionPath); },
      patch(pattern, actionPath) { router.route('patch', `${ namespace }/${ pattern }`, actionPath); },
      delete(pattern, actionPath) { router.route('delete', `${ namespace }/${ pattern }`, actionPath); },
      resource(resourceName, options) {
        router.resource.call(this, resourceName, options);
      }
    }
    if (fn) {
      fn(wrapper);
    } else {
      return wrapper;
    }
  }

}
