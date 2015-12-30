'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _inflection = require('inflection');

var _ensureArray = require('../utils/ensure-array');

var _ensureArray2 = _interopRequireDefault(_ensureArray);

var _contains = require('lodash/collection/contains');

var _contains2 = _interopRequireDefault(_contains);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _default(_addon) {
  // Define a DSL for routes
  return {

    // Attach a route to the addon

    route: function route(method, pattern, actionPath) {
      _addon.router[method](pattern, _addon.handlerForAction(actionPath));
    },

    // Single routes
    get: function get() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      this.route.apply(this, ['get'].concat(args));
    },
    post: function post() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      this.route.apply(this, ['post'].concat(args));
    },
    put: function put() {
      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      this.route.apply(this, ['put'].concat(args));
    },
    patch: function patch() {
      for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      this.route.apply(this, ['patch'].concat(args));
    },
    delete: function _delete() {
      for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
        args[_key5] = arguments[_key5];
      }

      this.route.apply(this, ['delete'].concat(args));
    },
    addon: function addon(namespace, addonName) {
      _addon._addonMounts[addonName] = namespace;
    },

    // Resource routes
    resource: function resource(resourceName) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var plural = (0, _inflection.pluralize)(resourceName);

      var collection = '/' + plural;
      var resource = collection + '/:id';
      var relationship = resource + '/relationships/:relation';
      var related = resource + '/:relation';

      if (options.related === false) {
        options.except = ['related', 'fetch-related', 'replace-related', 'add-related', 'remove-related'].concat(options.except);
      }

      var hasWhitelist = Boolean(options.only);
      options.only = (0, _ensureArray2.default)(options.only);
      options.except = (0, _ensureArray2.default)(options.except);

      function include(action) {
        var whitelisted = (0, _contains2.default)(options.only, action);
        var blacklisted = (0, _contains2.default)(options.except, action);
        return !blacklisted && (hasWhitelist && whitelisted || !hasWhitelist);
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
exports.default = _default;
module.exports = exports['default'];