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
import find from 'lodash/find';
import forEach from 'lodash/forEach';

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
    for (let i = 0; i < routes.length; i++) {
      request.params = routes[i].match(request.path);
      if (request.params) {
        request.route = routes[i];
        break;
      }
    }
    if (!request.route) {
      return this.handleError(request, response, new Errors.NotFound('Route not recognized'));
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

  route(method, rawPattern, actionPath, params) {
    // Ensure leading slashes, remove trailing ones
    let normalizedPattern = rawPattern.replace(/^([^\/])/, '/$1');
    normalizedPattern = normalizedPattern.replace(/\/$/, '');
    // Add route with and without trailing slash
    [ normalizedPattern, `${ normalizedPattern }/` ].forEach((pattern) => {
      let route = new Route(pattern);
      route.actionPath = actionPath;
      route.action = this.container.lookup(`action:${ actionPath }`);
      route.additionalParams = params;
      if (!route.action) {
        throw new Error(`No action found at ${ actionPath }`);
      }
      this.routes[method].push(route);
    });
  }

  urlFor(action, data) {
    if (typeof action === 'string') {
      action = this.container.lookup(`action:${ action }`);
    }
    if (!action) {
      return null;
    }
    let route;
    forEach(this.routes, (routes) => {
      route = find(routes, { action: action.constructor });
      return !route; // kill the iterator if we found the match
    });
    return route ? route.reverse(data) : null;
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
    // TODO add sanitization in case `pattern` has leading slash, or `namespace` has trailing
    let wrapper = {
      get(pattern, ...args) { router.route('get', `${ namespace }/${ pattern }`, ...args); },
      post(pattern, ...args) { router.route('post', `${ namespace }/${ pattern }`, ...args); },
      put(pattern, ...args) { router.route('put', `${ namespace }/${ pattern }`, ...args); },
      patch(pattern, ...args) { router.route('patch', `${ namespace }/${ pattern }`, ...args); },
      delete(pattern, ...args) { router.route('delete', `${ namespace }/${ pattern }`, ...args); },
      resource(resourceName, options) {
        router.resource.call(this, resourceName, options);
      }
    };
    if (fn) {
      fn(wrapper);
    } else {
      return wrapper;
    }
  }

}
