import { singularize, pluralize } from 'inflection';
import ensureArray from '../utils/ensure-array';
import contains from 'lodash/collection/contains';

export default function(application) {
  // Define a DSL for routes
  return {

    // Attach a route to the addon
    route(method, pattern, actionPath) {
      let handler = application.createActionHandler(actionPath);
      let serializer;
      if (actionPath.indexOf('/') > -1) {
        let type = singularize(actionPath.split('/')[0]);
        serializer = application.container.lookup('serializer:' + type);
      }
      application.router[method](pattern, function parseAndHandle(req, res, next) {
        if (serializer && serializer.parse) {
          req.body = serializer.parse(req.body);
        }
        handler(req, res, next);
      });
    },

    // Single routes
    get(...args) { this.route('get', ...args); },
    post(...args) { this.route('post', ...args); },
    put(...args) { this.route('put', ...args); },
    patch(...args) { this.route('patch', ...args); },
    delete(...args) { this.route('delete', ...args); },

    // Resource routes
    resource(resourceName, options = {}) {
      let plural = pluralize(resourceName);

      let collection = '/' + plural;
      let resource = collection + '/:id';
      let relationship = resource + '/relationships/:relation';
      let related = resource + '/:relation';

      if (options.related === false) {
        options.except = [ 'related', 'fetch-related', 'replace-related', 'add-related', 'remove-related' ].concat(options.except);
      }

      let hasWhitelist = Boolean(options.only);
      options.only = ensureArray(options.only);
      options.except = ensureArray(options.except);

      function include(action) {
        let whitelisted = contains(options.only, action);
        let blacklisted = contains(options.except, action);
        return !blacklisted && (
          hasWhitelist && whitelisted ||
          !hasWhitelist
        );
      }

      // Fetch the list of books as the primary data
      if (include('list')) {
        this.get(collection, plural + '/list');
      }
      // Create a new book
      if (include('create')) {
        this.post(collection, plural + '/create');
      }

      // Fetch a single book as the primary data
      if (include('show')) {
        this.get(resource, plural + '/show');
      }
      // Update (patch) a single book
      if (include('update')) {
        this.patch(resource, plural + '/update');
      }
      // Destroy a single book
      if (include('destroy')) {
        this.delete(resource, plural + '/destroy');
      }

      // Fetch the reviews for a single book as the primary data
      if (include('related')) {
        this.get(related, plural + '/related');
      }

      // Fetch the ids of the reviews for a single book
      if (include('fetch-related')) {
        this.get(relationship, plural + '/fetch-related');
      }
      // Replace the related reviews for a single book (via ids)
      if (include('replace-related')) {
        this.patch(relationship, plural + '/replace-related');
      }
      // Add a new review related to a single book (via id)
      if (include('add-related')) {
        this.post(relationship, plural + '/add-related');
      }
      // Remove a review related to a single book (via id)
      if (include('remove-related')) {
        this.delete(relationship, plural + '/remove-related');
      }

    }
  };
}
