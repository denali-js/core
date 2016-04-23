/**
 * @module denali
 * @submodule testing
 */
const qs = require('qs');
const Promise = require('bluebird');
const merge = require('lodash/object/merge');
const forEach = require('lodash/collection/forEach');
const state = require('./global-state');

const BODY_METHODS = [ 'post', 'put', 'patch' ];
const BODYLESS_METHODS = [ 'get', 'head', 'options', 'delete' ];

/**
 * Send a request to the current testing application
 *
 * @method request
 * @param method {String} GET, POST, PUT, PATCH, DELETE
 * @param url {String} the url path, without a hostname
 * @param options {Object}
 * @param options.data {Object} query string params or request body to send
 * (depending on the method supplied)
 * @param options.query {Object} query string params to add to the URL
 * @param options.headers {Object}
 * @return {Promise} resolves with the response object (see supertest docs)
 * @for Denali.Testing.helpers
 */
module.exports = function sendRequest(method, url, options = {}) {
  method = method.toLowerCase();
  return new Promise((resolve, reject) => {

    // Query params
    if (options.data && BODYLESS_METHODS.indexOf(method) > -1) {
      url = `${ url }?${ qs.stringify(options.data) }`;
    }
    if (options.query) {
      url = `${ url }?${ qs.stringify(options.query) }`;
    }

    // The base request
    let request = state.server[method](url);

    // Headers
    let headers = merge({}, state.headers, options.headers);
    forEach(headers, (value, name) => {
      request = request.set(name, value);
    });

    // Body
    if (options.data && BODY_METHODS.indexOf(method) > -1) {
      request = request.send(JSON.stringify(options.data));
    }

    // Response handling
    request.end((err, response) => {
      if (err) {
        return reject(err);
      }
      if (response.statusCode >= 500) {
        let body = JSON.parse(response.error.text).errors[0];
        let error = new Error(`[action:${ body.meta.action }] ${ body.detail }`);
        error.stack = body.meta.stack;
        return reject(error);
      }
      resolve(response);
    });

  });
};
