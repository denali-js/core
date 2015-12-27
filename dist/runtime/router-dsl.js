import { pluralize } from 'inflection';
import ensureArray from '../utils/ensure-array';
import contains from 'lodash/collection/contains';

export default function(engine) {
  // Define a DSL for routes
  return {

    // Attach a route to the engine
    route(method, pattern, actionPath) {
      engine.router[method](pattern, engine.handlerForAction(actionPath));
    },

    // Single routes
    get(...args) { this.route('get', ...args); },
    post(...args) { this.route('post', ...args); },
    put(...args) { this.route('put', ...args); },
    patch(...args) { this.route('patch', ...args); },
    delete(...args) { this.route('delete', ...args); },

    engine(namespace, engineName) {
      engine._engineMounts[engineName] = namespace;
    },

    // Resource routes
    resource(resourceName, options = {}) {
      let plural = pluralize(resourceName);

      let collection = '/' + plural;
      let resource = collection + '/:id';
      let relationship = resource + '/relationships/:relation';
      let related = resource + '/:relation';

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
        this.get(collection, plural + '.list');
      }
      // Create a new book
      if (include('create')) {
        this.post(collection, plural + '.create');
      }

      // Fetch a single book as the primary data
      if (include('show')) {
        this.get(resource, plural + '.show');
      }
      // Update (patch) a single book
      if (include('update')) {
        this.patch(resource, plural + '.update');
      }
      // Destroy a single book
      if (include('destroy')) {
        this.delete(resource, plural + '.destroy');
      }

      // Fetch the reviews for a single book as the primary data
      if (include('related')) {
        this.get(related, plural + '.related');
      }

      // Fetch the ids of the reviews for a single book
      if (include('fetchRelated')) {
        this.get(relationship, plural + '.fetchRelated');
      }
      // Replace the related reviews for a single book (via ids)
      if (include('replaceRelated')) {
        this.patch(relationship, plural + '.replaceRelated');
      }
      // Add a new review related to a single book (via id)
      if (include('addRelated')) {
        this.post(relationship, plural + '.addRelated');
      }
      // Remove a review related to a single book (via id)
      if (include('removeRelated')) {
        this.delete(relationship, plural + '.removeRelated');
      }

    }
  };
}
