/**
 * @module denali
 * @submodule testing
 */
const request = require('./request');
const createApplication = require('./create-application');
const getHeader = require('./get-header');
const setHeader = require('./set-header');
const removeHeader = require('./remove-header');
const lookup = require('./lookup');
const state = require('./global-state');

/**
 * A set of helpers for testing Denali applications
 *
 * @class Testing.helpers
 * @static
 */
module.exports = {
  request,
  createApplication,
  getHeader,
  setHeader,
  removeHeader,
  lookup,
  state
};
